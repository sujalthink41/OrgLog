"""OrgLog SDK exceptions."""


class OrgLogError(Exception):
    """Base exception for all OrgLog SDK errors."""


class AuthError(OrgLogError):
    """Raised when authentication fails (bad credentials, expired token)."""


class APIError(OrgLogError):
    """Raised when the OrgLog API returns an error response."""

    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(f"API error {status_code}: {detail}")


class ConfigError(OrgLogError):
    """Raised when the SDK is misconfigured (missing required params)."""
