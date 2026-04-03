# OrgLog Python SDK

Send logs from any Python service to your OrgLog platform in 2 lines of code.

## Install

```bash
pip install orglog
```

Or install from source:

```bash
cd sdk
pip install .
```

## Quick Start

```python
from orglog import OrgLog

logger = OrgLog(
    base_url="http://localhost:8080",       # your OrgLog server URL
    email_prefix="sujal",                   # your OrgLog login
    password="your-password",
    project_id="your-project-uuid",         # from the OrgLog dashboard
    service="payment-service",              # identifies this service in logs
)

logger.info("Payment processed", metadata={"amount": 500, "currency": "INR"})
logger.error("Payment failed", metadata={"error": "gateway_timeout"})
```

That's it. Logs show up in your OrgLog dashboard in real-time.

## Authentication

Two ways to authenticate:

```python
# Option 1: Credentials (recommended) — auto-login + auto-refresh
logger = OrgLog(
    base_url="http://localhost:8080",
    email_prefix="sujal",
    password="your-password",
    project_id="...",
    service="my-service",
)

# Option 2: Pre-obtained JWT token
logger = OrgLog(
    base_url="http://localhost:8080",
    token="eyJhbGciOi...",
    project_id="...",
    service="my-service",
)
```

## Log Levels

```python
logger.debug("Verbose debug info")
logger.info("Something happened")
logger.warning("Watch out")
logger.error("Something broke")
logger.critical("System is down")

# or use the generic method
logger.log("ERROR", "Something broke")
```

## Metadata

Attach any structured data to your logs:

```python
logger.info("User signed up", metadata={
    "user_id": "u_123",
    "plan": "pro",
    "source": "google_ads",
})
```

## Distributed Tracing

Pass a `trace_id` to correlate logs across services:

```python
trace = "550e8400-e29b-41d4-a716-446655440000"

logger.info("Request received", trace_id=trace)
logger.info("Calling payment API", trace_id=trace)
logger.info("Payment complete", trace_id=trace)
```

If omitted, a random UUID is generated per log entry.

## Batching & Performance

The SDK batches logs automatically to avoid hammering your server:

```python
logger = OrgLog(
    base_url="http://localhost:8080",
    email_prefix="sujal",
    password="...",
    project_id="...",
    service="high-throughput-service",
    batch_size=50,          # send every 50 logs (default: 10)
    flush_interval=10.0,    # or every 10 seconds (default: 5.0)
)
```

Logs are buffered in memory and flushed when either threshold is hit.

### Manual flush

```python
logger.flush()  # send all buffered logs immediately
```

## Context Manager

```python
with OrgLog(base_url="...", email_prefix="...", password="...", project_id="...", service="worker") as logger:
    logger.info("Job started")
    do_work()
    logger.info("Job finished")
# auto-flushed and closed here
```

## Clean Shutdown

The SDK registers an `atexit` handler to flush remaining logs on process exit. You can also call it manually:

```python
logger.close()
```

## Error Handling

```python
from orglog import OrgLog, AuthError, APIError, ConfigError

try:
    logger = OrgLog(...)
except AuthError:
    print("Bad credentials")
except ConfigError:
    print("Missing required config")

try:
    logger.info("test")
    logger.flush()
except APIError as e:
    print(f"API returned {e.status_code}: {e.detail}")
```

## Configuration Reference

| Parameter        | Required | Default | Description                              |
|-----------------|----------|---------|------------------------------------------|
| `base_url`      | Yes      | —       | OrgLog server URL                        |
| `project_id`    | Yes      | —       | Project UUID from the dashboard          |
| `service`       | Yes      | —       | Name identifying this service            |
| `email_prefix`  | *        | —       | Login email prefix (before @)            |
| `password`      | *        | —       | Login password                           |
| `token`         | *        | —       | Pre-obtained JWT access token            |
| `batch_size`    | No       | `10`    | Flush after this many buffered logs      |
| `flush_interval`| No       | `5.0`   | Flush every N seconds                    |
| `auto_flush`    | No       | `True`  | Enable background flush thread           |

\* Provide either `token` OR both `email_prefix` + `password`.
