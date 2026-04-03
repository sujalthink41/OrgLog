"""OrgLog SDK client — send logs to your OrgLog platform."""

from __future__ import annotations

import atexit
import threading
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

import httpx

from .exceptions import APIError, AuthError, ConfigError
from .types import LogEntry

_LEVELS = ("DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL")


class OrgLog:
    """
    OrgLog Python SDK client.

    Usage:
        logger = OrgLog(
            base_url="https://orglog.yourcompany.com",
            email_prefix="sujal",
            password="your-password",
            project_id="uuid-of-your-project",
            service="payment-service",
        )
        logger.info("Payment processed", metadata={"amount": 500})
        logger.error("Payment failed", metadata={"error": "timeout"})

        # flush remaining logs before exit
        logger.flush()
    """

    def __init__(
        self,
        *,
        base_url: str,
        project_id: str,
        service: str,
        email_prefix: Optional[str] = None,
        password: Optional[str] = None,
        token: Optional[str] = None,
        batch_size: int = 10,
        flush_interval: float = 5.0,
        auto_flush: bool = True,
    ):
        # --- validate config ---
        if not base_url:
            raise ConfigError("base_url is required")
        if not project_id:
            raise ConfigError("project_id is required")
        if not service:
            raise ConfigError("service is required")
        if token is None and (email_prefix is None or password is None):
            raise ConfigError(
                "Provide either 'token' or both 'email_prefix' and 'password'"
            )

        self._base_url = base_url.rstrip("/")
        self._project_id = project_id
        self._service = service
        self._email_prefix = email_prefix
        self._password = password
        self._batch_size = batch_size
        self._flush_interval = flush_interval

        # --- auth state ---
        self._access_token: Optional[str] = token
        self._client = httpx.Client(timeout=30.0)

        # --- batch buffer ---
        self._buffer: List[LogEntry] = []
        self._lock = threading.Lock()

        # --- authenticate if credentials provided ---
        if token is None:
            self._login()

        # --- background flusher ---
        self._closed = False
        if auto_flush:
            self._flush_thread = threading.Thread(
                target=self._background_flush, daemon=True
            )
            self._flush_thread.start()
            atexit.register(self.close)

    # ── public logging methods ──────────────────────────────────────

    def debug(
        self,
        message: str,
        *,
        metadata: Optional[Dict[str, Any]] = None,
        trace_id: Optional[str] = None,
    ):
        self._log("DEBUG", message, metadata=metadata, trace_id=trace_id)

    def info(
        self,
        message: str,
        *,
        metadata: Optional[Dict[str, Any]] = None,
        trace_id: Optional[str] = None,
    ):
        self._log("INFO", message, metadata=metadata, trace_id=trace_id)

    def warning(
        self,
        message: str,
        *,
        metadata: Optional[Dict[str, Any]] = None,
        trace_id: Optional[str] = None,
    ):
        self._log("WARNING", message, metadata=metadata, trace_id=trace_id)

    def error(
        self,
        message: str,
        *,
        metadata: Optional[Dict[str, Any]] = None,
        trace_id: Optional[str] = None,
    ):
        self._log("ERROR", message, metadata=metadata, trace_id=trace_id)

    def critical(
        self,
        message: str,
        *,
        metadata: Optional[Dict[str, Any]] = None,
        trace_id: Optional[str] = None,
    ):
        self._log("CRITICAL", message, metadata=metadata, trace_id=trace_id)

    def log(
        self,
        level: str,
        message: str,
        *,
        metadata: Optional[Dict[str, Any]] = None,
        trace_id: Optional[str] = None,
    ):
        level = level.upper()
        if level not in _LEVELS:
            raise ValueError(f"Invalid log level '{level}'. Must be one of {_LEVELS}")
        self._log(level, message, metadata=metadata, trace_id=trace_id)

    def flush(self):
        """Send all buffered logs to OrgLog immediately."""
        with self._lock:
            if not self._buffer:
                return
            batch = self._buffer[:]
            self._buffer.clear()
        self._send_batch(batch)

    def close(self):
        """Flush remaining logs and shut down the client."""
        if self._closed:
            return
        self._closed = True
        self.flush()
        self._client.close()

    # ── internal methods ────────────────────────────────────────────

    def _log(
        self,
        level: str,
        message: str,
        *,
        metadata: Optional[Dict[str, Any]] = None,
        trace_id: Optional[str] = None,
    ):
        entry = LogEntry(
            project_id=self._project_id,
            service=self._service,
            level=level,
            message=message,
            trace_id=trace_id or str(uuid4()),
            metadata=metadata,
        )
        with self._lock:
            self._buffer.append(entry)
            if len(self._buffer) >= self._batch_size:
                batch = self._buffer[:]
                self._buffer.clear()
            else:
                return
        self._send_batch(batch)

    def _send_batch(self, batch: List[LogEntry]):
        """Send a batch of log entries to the ingest endpoint."""
        for entry in batch:
            self._send_single(entry, retry=True)

    def _send_single(self, entry: LogEntry, *, retry: bool = True):
        """Send a single log entry. Retries once after re-auth on 401."""
        headers = {"Authorization": f"Bearer {self._access_token}"}
        try:
            resp = self._client.post(
                f"{self._base_url}/api/v1/ingest",
                json=entry.to_dict(),
                headers=headers,
            )
        except httpx.HTTPError as exc:
            raise APIError(0, f"Connection error: {exc}") from exc

        if resp.status_code == 401 and retry and self._email_prefix:
            self._login()
            return self._send_single(entry, retry=False)

        if resp.status_code >= 400:
            detail = (
                resp.json().get("detail", resp.text)
                if resp.headers.get("content-type", "").startswith("application/json")
                else resp.text
            )
            raise APIError(resp.status_code, detail)

    def _login(self):
        """Authenticate with the OrgLog API and store the access token."""
        try:
            resp = self._client.post(
                f"{self._base_url}/api/v1/auth/login",
                json={
                    "email_prefix": self._email_prefix,
                    "password": self._password,
                },
            )
        except httpx.HTTPError as exc:
            raise AuthError(f"Failed to connect to OrgLog: {exc}") from exc

        if resp.status_code != 200:
            detail = "Invalid credentials"
            try:
                detail = resp.json().get("detail", detail)
            except Exception:
                pass
            raise AuthError(f"Login failed: {detail}")

        data = resp.json()
        self._access_token = data["access_token"]

    def _background_flush(self):
        """Periodically flush buffered logs."""
        while not self._closed:
            time.sleep(self._flush_interval)
            try:
                self.flush()
            except Exception:
                pass  # don't crash the background thread

    # ── context manager ─────────────────────────────────────────────

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()

    def __repr__(self):
        return f"OrgLog(service={self._service!r}, project={self._project_id!r})"
