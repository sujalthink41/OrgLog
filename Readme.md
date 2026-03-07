# 🚀 OrgLog

> A production-grade, multi-tenant, event-driven logging platform for internal organizations.

OrgLog is a high-performance logging infrastructure designed to ingest, process, stream, and analyze logs at scale.
It is built with a distributed, event-driven architecture and is designed to evolve from a single-node setup to a horizontally scalable production system.

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Poetry
- PostgreSQL running on port 5432
- Redis running on port 6379

### Setup

```bash
# install dependencies
python3 -m poetry install

# copy env and configure
cp .env.example .env

# run database migrations
python3 -m poetry run alembic upgrade head
```

### Running

You need **two terminals**:

**Terminal 1 — API Server**
```bash
python3 -m poetry run uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Log Worker**
```bash
python3 -m poetry run python -m app.workers.log_worker
```

### Test It

Open Swagger UI at `http://localhost:8000/docs` and send a log, or use curl:

```bash
curl -X POST http://localhost:8000/api/v1/logs \
  -H "Content-Type: application/json" \
  -d '{"project_id":"550e8400-e29b-41d4-a716-446655440000","trace_id":"660e8400-e29b-41d4-a716-446655440000","service":"payment-service","level":"ERROR","message":"Payment failed","metadata":{"user_id":"u1","amount":120}}'
```

Verify in PostgreSQL: `SELECT * FROM logs;`

### Environment Variables

| Variable | Description | Example |
|---|---|---|
| `REDIS_HOST` | Redis hostname | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `DATABASE_URL` | Async PostgreSQL URL | `postgresql+asyncpg://postgres:postgres@localhost:5432/orglog` |

### Project Structure

```
app/
  api/v1/          # API routes
  core/            # Config, Redis client, dependencies
  data/
    database/      # SQLAlchemy base, session, mixins
    models/        # ORM models
  domain/          # Domain entities and enums
  infrastructure/  # Redis publisher, Postgres repository
  interfaces/      # Abstract base classes (ports)
  schemas/         # Pydantic request/response models
  services/        # Business logic
  workers/         # Redis stream consumers
  utils/           # Helpers
migrations/        # Alembic migrations
```

---

## 🧠 Why OrgLog?

Most teams either:

* Print logs to stdout
* Store logs in PostgreSQL
* Or rely on expensive third-party SaaS tools

OrgLog gives you:

* 🔥 Full control over your logging infrastructure
* ⚡ Real-time log streaming
* 📊 Fast analytical queries
* 🧵 Event-driven architecture
* 🏢 Multi-tenant support
* 🚀 Production scalability

Think of it as a mini internal version of Datadog / ELK / Logtail — purpose-built for your organization.

---

# 🏗 Architecture Overview

```
Client Apps (SDKs)
        |
        v
   API Gateway
        |
        v
   FastAPI Ingestion Service
        |
        v
   Redis Streams (Event Queue)
        |
        v
   Log Processor Workers
        |
        +----------------------+
        |                      |
        v                      v
   ClickHouse (Logs)     PostgreSQL (Metadata)
        |
        v
   WebSocket Service
        |
        v
   Real-time Dashboard
```

### Key Design Principles

* Asynchronous ingestion
* Event-driven processing
* Horizontal scalability
* Backpressure handling
* Multi-tenant isolation
* Observability-first design

---

# ⚙️ Tech Stack

| Layer          | Technology                         |
| -------------- | ---------------------------------- |
| API            | FastAPI                            |
| Event Queue    | Redis Streams (Kafka-ready design) |
| Log Storage    | ClickHouse                         |
| Metadata DB    | PostgreSQL                         |
| Cache          | Redis                              |
| Live Streaming | WebSockets                         |
| Monitoring     | Prometheus + Grafana               |
| Deployment     | Docker → Kubernetes                |

---

# 🧱 Core Components

## 1️⃣ Ingestion Service

* Accepts logs via REST API
* Authenticates using API keys
* Applies rate limiting
* Pushes logs to Redis Streams
* Returns immediately (non-blocking)

### Example API

`POST /v1/logs`

```json
{
  "service": "payment-service",
  "level": "ERROR",
  "message": "Payment failed",
  "trace_id": "abc-123",
  "metadata": {
    "user_id": "u1",
    "amount": 120
  }
}
```

---

## 2️⃣ Worker Service

* Consumes logs from Redis Streams
* Writes to ClickHouse
* Publishes to live channels
* Detects error spikes
* Triggers alerts

---

## 3️⃣ Storage Layer

### ClickHouse (Hot Logs)

Optimized for:

* High write throughput
* Fast aggregations
* Time-series analytics
* Billions of rows

### PostgreSQL (Metadata)

Stores:

* Organizations
* Projects
* API keys
* Plans
* Rate limits
* User roles

---

## 4️⃣ WebSocket Service

Provides:

* Real-time log streaming
* Live tailing per project
* Error monitoring dashboard

Example:

```
INFO    auth-service    User logged in
ERROR   payment-service Payment failed
WARN    api-service     High latency
```

---

# 🔐 Multi-Tenant Model

OrgLog is designed as a SaaS-style system.

### Entities

* Organization
* Project
* API Key
* Log Entry

Every log is scoped to a `project_id`.

Isolation is enforced at:

* API layer
* Worker layer
* Query layer
* WebSocket layer

---

# 📈 Production Features

* API key hashing
* Rate limiting (Redis-based)
* Log size validation
* JSON schema validation
* Error spike detection
* Log retention policies
* Horizontal scaling
* Consumer groups
* Replay capability
* Backpressure tolerance

---

# 📊 Observability

OrgLog monitors itself.

Metrics exposed for:

* Logs per second
* Worker lag
* Queue depth
* Error rate
* API latency
* Memory usage

Integrated with:

* Prometheus
* Grafana

---

# 🚀 Deployment Modes

## Development

* Docker Compose
* Single-node Redis
* Single-node ClickHouse
* Single worker

## Production

* Kubernetes
* Redis cluster
* ClickHouse cluster
* Horizontal pod autoscaling
* Isolated worker pools

---

# 🛠 Roadmap

### Phase 1 — Core Logging

* Ingestion API
* Redis Streams
* Worker
* ClickHouse integration

### Phase 2 — Live Streaming

* WebSocket service
* Project-based streaming

### Phase 3 — Analytics

* Error aggregation
* Service-level metrics
* Dashboard UI

### Phase 4 — Advanced Infra

* Kafka migration
* Cold storage (S3)
* Log retention policies
* RBAC
* Distributed tracing

---

# 🧨 Future "Crazy" Features

* Distributed trace reconstruction
* Structured log enforcement
* Query engine for log analytics
* Log sampling strategies
* Adaptive rate limiting
* Real-time anomaly detection
* Replay logs from stream
* Cross-service correlation

---

# 🎯 Goals of This Project

This is not a CRUD app.

This project is designed to teach and implement:

* Event-driven systems
* Real-world backpressure handling
* Queue semantics
* Horizontal scaling
* Production-grade API design
* Multi-tenant SaaS architecture
* Infrastructure engineering

---

# 📜 License

Internal organization project.
Not intended for public distribution (yet 😉).

---

# 🧠 Philosophy

> Logs are not just strings.
> Logs are events.
> Events build observability.
> Observability builds reliability.

---

**OrgLog — Build your own logging infrastructure.**
