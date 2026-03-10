# OrgLog

**A production-grade, multi-tenant, event-driven centralized logging platform.**

OrgLog is a high-performance logging infrastructure designed to ingest, process, stream, and analyze logs at scale. Built with an async, event-driven architecture — from a single-node Docker Compose setup to a horizontally scalable production system.

> Logs are not just strings. Logs are events. Events build observability. Observability builds reliability.

---

## Screenshots

### Dashboard — Platform Overview
Stat cards, log level distribution, error trends, service breakdown, and recent logs at a glance.

![Dashboard](docs/screenshots/OrgLog1.png)

### Log Explorer — Search & Inspect
Full-text search, level/service/time-range filters, expandable rows with metadata, trace IDs, and JSON copy.

![Log Explorer](docs/screenshots/OrgLog2.png)

### Live Tail — Real-Time Streaming
WebSocket-powered terminal with per-level coloring, inline metadata expansion, pause/resume, and level filtering.

![Live Tail](docs/screenshots/OrgLog3.png)

### Analytics — Metrics & Insights
Error rate tracking, log level distribution, per-service volume, and error trend over time.

![Analytics](docs/screenshots/OrgLog4.png)

---

## Architecture

```
Client Apps / SDKs
        |
        v
   FastAPI Ingestion Service  (POST /api/v1/logs)
        |
        v
   Redis Streams  (Event Queue — Consumer Groups)
        |
        v
   Log Processor Worker
        |
        +---------------------------+
        |                           |
        v                           v
   PostgreSQL (Log Storage)   Redis Pub/Sub (Broadcast)
                                    |
                                    v
                              WebSocket Service  (/ws/{project_id})
                                    |
                                    v
                              Next.js Dashboard  (Real-time UI)
```

### Design Principles

- Asynchronous, non-blocking ingestion
- Event-driven processing via Redis Streams
- At-least-once delivery with consumer groups
- Multi-tenant isolation per `project_id`
- Stateless services for horizontal scaling
- Clean architecture with repository pattern and dependency injection

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend API** | FastAPI, Uvicorn, Python 3.12 |
| **Event Queue** | Redis Streams 7 (Kafka-ready design) |
| **Log Storage** | PostgreSQL 16 |
| **Real-Time** | WebSockets + Redis Pub/Sub |
| **ORM** | SQLAlchemy 2.0 (async) + Alembic |
| **Frontend** | Next.js 16, TypeScript, Tailwind CSS |
| **Charts** | Recharts |
| **State** | TanStack React Query |
| **Deployment** | Docker Compose |

---

## Quick Start

### Prerequisites

- Docker & Docker Compose

### Run Everything

```bash
# Start backend (Postgres, Redis, API, Worker)
docker compose up -d

# Run database migrations
docker compose exec api alembic upgrade head

# Start frontend
cd frontend
npm install
npm run dev
```

- **API**: http://localhost:8000
- **Swagger UI**: http://localhost:8000/docs
- **Dashboard**: http://localhost:3000

### Send a Test Log

```bash
curl -X POST http://localhost:8000/api/v1/logs \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "trace_id": "660e8400-e29b-41d4-a716-446655440000",
    "service": "payment-service",
    "level": "ERROR",
    "message": "Payment gateway timeout after 30s",
    "metadata": {"order_id": "ORD-456", "amount": 299.99}
  }'
```

### Local Development (without Docker)

```bash
# Backend
python3 -m poetry install
cp .env.example .env
python3 -m poetry run alembic upgrade head

# Terminal 1 — API
python3 -m poetry run uvicorn app.main:app --reload --port 8000

# Terminal 2 — Worker
python3 -m poetry run python -m app.workers.log_worker

# Terminal 3 — Frontend
cd frontend && npm install && npm run dev
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Health check |
| `POST` | `/api/v1/logs` | Ingest a log (non-blocking, queued via Redis Streams) |
| `GET` | `/api/v1/logs` | Search logs with filters and pagination |
| `GET` | `/api/v1/logs/analytics` | Aggregated analytics per project |
| `WS` | `/api/v1/ws/{project_id}` | Real-time log stream via WebSocket |

### Search Parameters

| Parameter | Type | Description |
|---|---|---|
| `project_id` | UUID (required) | Filter by project |
| `service` | string | Filter by service name |
| `level` | enum | DEBUG, INFO, WARNING, ERROR, CRITICAL |
| `start_time` | ISO datetime | From timestamp |
| `end_time` | ISO datetime | To timestamp |
| `search_text` | string | Full-text search in message |
| `limit` | int (1-100) | Page size (default: 50) |
| `offset` | int | Pagination offset |

---

## Project Structure

```
OrgLog/
├── app/                          # Backend (Python/FastAPI)
│   ├── api/v1/                   # REST + WebSocket routes
│   ├── core/                     # Config, Redis client, DI
│   ├── data/
│   │   ├── database/             # SQLAlchemy base, session, mixins
│   │   └── models/               # ORM models
│   ├── domain/                   # Domain entities & enums
│   ├── infrastructure/           # Redis publisher, Postgres repository, Pub/Sub
│   ├── interfaces/               # Abstract base classes (ports)
│   ├── schemas/                  # Pydantic request/response models
│   ├── services/                 # Business logic layer
│   ├── workers/                  # Redis stream consumer workers
│   └── utils/                    # Helpers
├── migrations/                   # Alembic database migrations
├── frontend/                     # Frontend (Next.js/TypeScript)
│   └── src/
│       ├── app/                  # Pages (Dashboard, Logs, Live Tail, Analytics)
│       ├── components/
│       │   ├── ui/               # Reusable primitives (Button, Card, Badge, etc.)
│       │   ├── layout/           # Sidebar, Header
│       │   ├── dashboard/        # Stat cards, charts
│       │   └── logs/             # Log table, filters, live stream
│       └── lib/
│           ├── api/              # API client layer
│           ├── constants/        # Design tokens & app config
│           ├── hooks/            # Custom React hooks
│           ├── providers/        # Global state (Query, Project, WebSocket, Sidebar)
│           ├── types/            # TypeScript types
│           └── utils/            # Formatters & helpers
├── docs/                         # Scope documents & screenshots
├── docker-compose.yml            # Full stack orchestration
└── Dockerfile                    # Backend container image
```

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `REDIS_HOST` | Redis hostname | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `DATABASE_URL` | Async PostgreSQL URL | `postgresql+asyncpg://postgres:postgres@localhost:5432/orglog` |
| `NEXT_PUBLIC_API_URL` | Backend API URL (frontend) | `http://localhost:8000` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL (frontend) | `ws://localhost:8000` |

---

## Why OrgLog?

Most teams either print logs to stdout, dump them into a general-purpose database, or pay for expensive SaaS tools. OrgLog gives you:

- **Full control** over your logging infrastructure
- **Real-time streaming** via WebSocket
- **Fast search** with filters and pagination
- **Event-driven architecture** ready for Kafka migration
- **Multi-tenant isolation** per project
- **Production scalability** — stateless services, consumer groups, horizontal scaling

Think of it as a purpose-built internal alternative to Datadog / ELK / Logtail.

---

## Roadmap

- [x] Log Ingestion API (non-blocking, Redis Streams)
- [x] Event-driven worker processing
- [x] PostgreSQL log storage
- [x] Search API with filters & pagination
- [x] Real-time WebSocket streaming
- [x] Basic error analytics
- [x] Docker Compose deployment
- [x] Frontend dashboard (Next.js)
- [ ] API key authentication & management
- [ ] Redis-based rate limiting
- [ ] Prometheus metrics & observability
- [ ] Database indexes & query optimization
- [ ] Kafka migration
- [ ] Cold storage (S3)
- [ ] Role-based access control
- [ ] Distributed tracing

---

## License

Internal organization project. Not intended for public distribution.
