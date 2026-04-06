# OrgLog Integration Guide

**How to integrate OrgLog into any Python project in your organization.**

This guide walks you through everything — from installing the SDK to seeing your first logs in the OrgLog dashboard.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Install the SDK](#install-the-sdk)
3. [Quick Start (2 minutes)](#quick-start-2-minutes)
4. [Integration with Existing Logging](#integration-with-existing-logging)
   - [Standard Python logging](#option-1-standard-python-logging)
   - [Structlog](#option-2-structlog)
   - [Django](#option-3-django)
   - [Flask](#option-4-flask)
5. [Configuration Reference](#configuration-reference)
6. [Advanced Usage](#advanced-usage)
   - [Distributed Tracing](#distributed-tracing)
   - [Batching & Performance](#batching--performance)
   - [Context Manager](#context-manager)
   - [Error Handling](#error-handling)
7. [Environment Variables Setup](#environment-variables-setup)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you start, you need:

1. **An OrgLog account** — Register at your organization's OrgLog dashboard (e.g., `https://orglog.netlify.app`)
2. **A Project** — Create a project in the dashboard. Each project gets a unique UUID. One project = one service/app you want to monitor.
3. **Python 3.9+** — The SDK supports Python 3.9 and above.

---

## Install the SDK

```bash
pip install orglog
```

Or add it to your project's dependencies:

```toml
# pyproject.toml
dependencies = [
    "orglog>=0.1.0",
]
```

```txt
# requirements.txt
orglog>=0.1.0
```

---

## Quick Start (2 minutes)

This is the absolute minimum to get logs flowing:

```python
from orglog import OrgLog

# Initialize the client
logger = OrgLog(
    base_url="https://orglog-api.onrender.com",  # your OrgLog backend URL
    email_prefix="yourname",                       # your login (before @)
    password="your-password",                      # your OrgLog password
    project_id="your-project-uuid",                # from the dashboard
    service="my-service",                          # identifies this app
)

# Send logs
logger.info("Application started")
logger.warning("Disk usage at 85%", metadata={"disk": "/dev/sda1", "percent": 85})
logger.error("Database connection failed", metadata={"host": "db.internal", "retries": 3})

# Ensure all logs are sent before exit
logger.flush()
```

Open the OrgLog dashboard, select your project, and you'll see these logs in real-time.

---

## Integration with Existing Logging

You probably don't want to replace your existing `logger.info(...)` calls. Instead, hook OrgLog into your existing logging framework so **every log automatically flows to OrgLog** without changing any code.

### Option 1: Standard Python `logging`

This works for any Python project that uses the built-in `logging` module.

**Step 1:** Create an `orglog_integration.py` file in your project:

```python
# orglog_integration.py
import logging
import os
import threading

from orglog import OrgLog

# Prevent infinite recursion (OrgLog uses httpx which also logs)
EXCLUDED_LOGGERS = frozenset({"httpx", "httpcore", "urllib3", "orglog"})


class OrgLogHandler(logging.Handler):
    """Forwards Python log records to OrgLog."""

    def __init__(self, client: OrgLog):
        super().__init__()
        self._client = client
        self._sending = threading.local()

    def emit(self, record: logging.LogRecord):
        if record.name.split(".")[0] in EXCLUDED_LOGGERS:
            return
        if getattr(self._sending, "active", False):
            return
        self._sending.active = True
        try:
            metadata = {
                "logger": record.name,
                "module": record.module,
                "funcName": record.funcName,
                "lineno": record.lineno,
            }
            if record.exc_info and record.exc_info[0] is not None:
                metadata["exception_type"] = record.exc_info[0].__qualname__
                metadata["exception_message"] = str(record.exc_info[1])

            self._client.log(
                record.levelname,
                self.format(record) or record.getMessage(),
                metadata=metadata,
            )
        except Exception:
            pass
        finally:
            self._sending.active = False


def setup_orglog():
    """Call this once at application startup."""
    client = OrgLog(
        base_url=os.environ["ORGLOG_ENDPOINT"],
        email_prefix=os.environ["ORGLOG_EMAIL_PREFIX"],
        password=os.environ["ORGLOG_PASSWORD"],
        project_id=os.environ["ORGLOG_PROJECT_ID"],
        service=os.environ.get("ORGLOG_SERVICE_NAME", "my-service"),
    )
    handler = OrgLogHandler(client)
    handler.setLevel(logging.INFO)
    logging.getLogger().addHandler(handler)
    return client
```

**Step 2:** Call `setup_orglog()` at startup:

```python
# main.py
from orglog_integration import setup_orglog

setup_orglog()

# Now ALL your existing logging calls automatically go to OrgLog
import logging
logger = logging.getLogger(__name__)
logger.info("This goes to OrgLog automatically!")
```

---

### Option 2: Structlog

If your project uses `structlog` (common in FastAPI projects):

**Step 1:** Create the integration (same `OrgLogHandler` as above).

**Step 2:** Call `setup_orglog()` AFTER `structlog.configure()`:

```python
# In your app's lifespan or startup
from contextlib import asynccontextmanager
from fastapi import FastAPI

@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_logging()   # your existing structlog setup
    setup_orglog()         # add OrgLog AFTER structlog configures handlers
    yield
    # cleanup on shutdown
```

This works because `setup_orglog()` adds a handler to the root logger, and structlog ultimately routes through Python's standard logging.

---

### Option 3: Django

```python
# settings.py
LOGGING = {
    "version": 1,
    "handlers": {
        "orglog": {
            "class": "myapp.orglog_integration.OrgLogHandler",
            # pass the OrgLog client instance
        },
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    "root": {
        "handlers": ["console", "orglog"],
        "level": "INFO",
    },
}
```

Or call `setup_orglog()` in your `AppConfig.ready()` method:

```python
# apps.py
from django.apps import AppConfig

class MyAppConfig(AppConfig):
    def ready(self):
        from orglog_integration import setup_orglog
        setup_orglog()
```

---

### Option 4: Flask

```python
# app.py
from flask import Flask
from orglog_integration import setup_orglog

app = Flask(__name__)

with app.app_context():
    setup_orglog()
```

---

## Configuration Reference

### SDK Parameters

| Parameter        | Required | Default | Description                              |
|-----------------|----------|---------|------------------------------------------|
| `base_url`      | Yes      | -       | OrgLog backend URL                       |
| `project_id`    | Yes      | -       | Project UUID (from dashboard)            |
| `service`       | Yes      | -       | Name identifying this service            |
| `email_prefix`  | *        | -       | Login email prefix (before @)            |
| `password`      | *        | -       | Login password                           |
| `token`         | *        | -       | Pre-obtained JWT access token            |
| `batch_size`    | No       | `10`    | Flush after this many buffered logs      |
| `flush_interval`| No       | `5.0`   | Flush every N seconds                    |
| `auto_flush`    | No       | `True`  | Enable background flush thread           |

*Provide either `token` OR both `email_prefix` + `password`.

### Environment Variables

We recommend using environment variables rather than hardcoding credentials:

```bash
# .env
ORGLOG_ENABLED=true
ORGLOG_ENDPOINT=https://orglog-api.onrender.com
ORGLOG_PROJECT_ID=06f64299-bb5a-4da1-adfc-beaf7697cd1f
ORGLOG_EMAIL_PREFIX=yourname
ORGLOG_PASSWORD=your-password
ORGLOG_SERVICE_NAME=my-service
```

---

## Advanced Usage

### Distributed Tracing

Correlate logs across services using a shared `trace_id`:

```python
import uuid

# Generate one trace ID per request
trace_id = str(uuid.uuid4())

# Service A
logger.info("Order received", trace_id=trace_id, metadata={"order_id": "ORD-123"})

# Service B (pass trace_id via HTTP header)
logger.info("Payment processing", trace_id=trace_id, metadata={"amount": 500})

# Service C
logger.info("Order fulfilled", trace_id=trace_id)
```

In the OrgLog dashboard, search by trace_id to see the complete request flow.

### Batching & Performance

For high-throughput services, tune the batching parameters:

```python
logger = OrgLog(
    base_url="...",
    email_prefix="...",
    password="...",
    project_id="...",
    service="high-throughput-worker",
    batch_size=50,          # buffer up to 50 logs
    flush_interval=10.0,    # or flush every 10 seconds
)
```

How batching works:
- Logs are buffered in memory (thread-safe)
- Flushed when EITHER `batch_size` is reached OR `flush_interval` elapses
- Background thread handles periodic flushing
- `atexit` handler ensures remaining logs are sent on process exit

### Context Manager

For scripts and short-lived processes:

```python
with OrgLog(base_url="...", email_prefix="...", password="...",
            project_id="...", service="migration-script") as logger:
    logger.info("Migration started")
    run_migration()
    logger.info("Migration completed")
# auto-flushed and closed here
```

### Error Handling

```python
from orglog import OrgLog, AuthError, APIError, ConfigError

try:
    logger = OrgLog(...)
except AuthError:
    print("Invalid credentials — check ORGLOG_EMAIL_PREFIX and ORGLOG_PASSWORD")
except ConfigError:
    print("Missing required parameter")

try:
    logger.info("test")
    logger.flush()
except APIError as e:
    print(f"OrgLog API error {e.status_code}: {e.detail}")
```

---

## Environment Variables Setup

### For local development

Create or update your `.env` file:

```bash
# OrgLog Integration
ORGLOG_ENABLED=true
ORGLOG_ENDPOINT=https://orglog-api.onrender.com
ORGLOG_PROJECT_ID=<your-project-uuid>
ORGLOG_EMAIL_PREFIX=<your-email-prefix>
ORGLOG_PASSWORD=<your-password>
ORGLOG_SERVICE_NAME=<your-service-name>
```

### For production (Docker / Render / Railway)

Set these as environment variables in your deployment platform. Never commit credentials to git.

---

## Troubleshooting

### Logs not showing up in the dashboard

1. **Check authentication** — Look for `[OrgLog] Authenticated successfully` in your terminal. If missing, verify your credentials.

2. **Check the project_id** — Make sure the UUID matches a project you created in the dashboard.

3. **Infinite recursion guard** — If you see no OrgLog output at all, make sure you're not accidentally filtering the `orglog` logger. The handler excludes `httpx`, `httpcore`, `urllib3`, and `orglog` loggers by default.

4. **Structlog handler replacement** — Structlog in dev mode replaces all root logger handlers (`root_logger.handlers = [handler]`). Make sure `setup_orglog()` is called AFTER `structlog.configure()` or `initialize_logging()`.

5. **Flush on exit** — For short-lived scripts, always call `logger.flush()` or use the context manager. The background flush runs every 5 seconds, so a script that exits immediately may not send buffered logs.

### Connection errors

- **Render free tier** spins down after 15 minutes of inactivity. The first request after idle takes ~30 seconds. The SDK handles this gracefully (30s timeout).
- Check that `ORGLOG_ENDPOINT` is correct and reachable: `curl https://orglog-api.onrender.com/api/v1/health`

### Token expiry

The SDK auto-handles token refresh. If you provided credentials (`email_prefix` + `password`), the SDK re-authenticates automatically when a 401 is received. If you provided a raw `token`, you'll need to refresh it manually.
