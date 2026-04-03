"""OrgLog Python SDK — send logs to your OrgLog platform in 2 lines of code."""

from .client import OrgLog
from .exceptions import APIError, AuthError, ConfigError, OrgLogError

__all__ = ["OrgLog", "OrgLogError", "AuthError", "APIError", "ConfigError"]
__version__ = "0.1.0"
