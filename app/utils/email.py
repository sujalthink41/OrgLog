from app.core.config import settings


def build_org_email(prefix: str) -> str:
    """Build full org email from prefix. e.g. 'sujal' -> 'sujal@think41.com'"""
    return f"{prefix}@{settings.ORG_DOMAIN}"
