# OrgLog Architecture

**A deep dive into how OrgLog works — the system design, data flow, multi-tenancy model, and every component that makes it tick.**

---

## Table of Contents

1. [What is OrgLog](#what-is-orglog)
2. [The Problem it Solves](#the-problem-it-solves)
3. [High-Level Architecture](#high-level-architecture)
4. [Component Breakdown](#component-breakdown)
   - [Python SDK](#1-python-sdk)
   - [FastAPI Backend](#2-fastapi-backend)
   - [Redis Streams (Event Queue)](#3-redis-streams-event-queue)
   - [Log Worker (Stream Consumer)](#4-log-worker-stream-consumer)
   - [PostgreSQL (Log Storage)](#5-postgresql-log-storage)
   - [Redis Pub/Sub (Real-time Broadcast)](#6-redis-pubsub-real-time-broadcast)
   - [WebSocket Service](#7-websocket-service)
   - [Next.js Frontend](#8-nextjs-frontend)
5. [Data Flow — End to End](#data-flow--end-to-end)
6. [Multi-Tenancy Architecture](#multi-tenancy-architecture)
7. [Authentication System](#authentication-system)
8. [Database Schema](#database-schema)
9. [Software Architecture Patterns](#software-architecture-patterns)
10. [API Design](#api-design)
11. [Frontend Architecture](#frontend-architecture)
12. [Deployment Architecture](#deployment-architecture)
13. [Scalability & Performance](#scalability--performance)
14. [Security Model](#security-model)
15. [Tech Stack Summary](#tech-stack-summary)
16. [Why These Choices](#why-these-choices)

---

## What is OrgLog

OrgLog is a **centralized, multi-tenant, event-driven logging platform** that any organization can self-host. It provides:

- A **Python SDK** (`pip install orglog`) that developers add to their services
- An **event-driven backend** that ingests, processes, stores, and streams logs in real-time
- A **dashboard** where teams can search logs, view live streams, and analyze error trends

Think of it as an internal, self-hosted alternative to Datadog, Logtail, or ELK Stack — purpose-built for organizational use.

---

## The Problem it Solves

Most engineering teams face one of these logging realities:

| Approach | Problem |
|----------|---------|
| `print()` / stdout | Logs disappear when containers restart. No search. No aggregation. |
| Writing to files | Logs are scattered across servers. No centralized view. |
| ELK Stack (Elasticsearch + Logstash + Kibana) | Complex to set up, resource-heavy, expensive to operate. |
| Datadog / New Relic / Logtail | Expensive at scale. Data leaves your infrastructure. Vendor lock-in. |

**OrgLog gives you:** centralized log aggregation, real-time streaming, search with filters, analytics — all self-hosted, all with a simple `pip install`.

---

## High-Level Architecture

```
+------------------+     +------------------+     +------------------+
|   Service A      |     |   Service B      |     |   Service C      |
|   (Python app)   |     |   (Python app)   |     |   (Python app)   |
|                  |     |                  |     |                  |
|   pip install    |     |   pip install    |     |   pip install    |
|   orglog         |     |   orglog         |     |   orglog         |
+--------+---------+     +--------+---------+     +--------+---------+
         |                         |                         |
         |        HTTPS (JSON)     |                         |
         +------------+------------+-------------------------+
                      |
                      v
         +---------------------------+
         |   FastAPI Ingestion API   |
         |   POST /api/v1/ingest     |
         |                           |
         |   - JWT Authentication    |
         |   - Project validation    |
         |   - Non-blocking publish  |
         +------------+--------------+
                      |
                      | XADD (append to stream)
                      v
         +---------------------------+
         |   Redis Streams           |
         |                           |
         |   Event queue with        |
         |   consumer groups         |
         |   (at-least-once          |
         |    delivery guarantee)    |
         +------------+--------------+
                      |
                      | XREADGROUP (consume events)
                      v
         +---------------------------+
         |   Log Worker              |
         |                           |
         |   - Parse log event       |
         |   - Save to PostgreSQL    |
         |   - Broadcast via Pub/Sub |
         +------+----------+---------+
                |          |
                v          v
   +-----------------+  +-------------------+
   |   PostgreSQL    |  |   Redis Pub/Sub   |
   |                 |  |                   |
   |   Persistent    |  |   Real-time       |
   |   log storage   |  |   broadcast to    |
   |   (search,      |  |   WebSocket       |
   |    analytics)   |  |   subscribers     |
   +---------+-------+  +---------+---------+
             |                     |
             v                     v
   +-----------------+  +-------------------+
   |   Search API    |  |   WebSocket       |
   |   GET /logs     |  |   /ws/{project}   |
   |   GET /analytics|  |                   |
   +---------+-------+  +---------+---------+
             |                     |
             +----------+----------+
                        |
                        v
            +------------------------+
            |   Next.js Dashboard    |
            |                        |
            |   - Dashboard overview |
            |   - Log explorer       |
            |   - Live tail          |
            |   - Analytics          |
            +------------------------+
```

---

## Component Breakdown

### 1. Python SDK

**Location:** `sdk/` | **Published:** PyPI (`pip install orglog`)

The SDK is the entry point for all log data. It's what developers in your org install in their Python services.

**How it works:**
- Developer creates an `OrgLog` client with credentials and project_id
- Calling `logger.info("message")` creates a `LogEntry` object and adds it to an in-memory buffer
- A background thread flushes the buffer every N seconds or when it hits batch_size
- Flush sends each log via HTTP POST to `/api/v1/ingest`
- Auto-handles JWT authentication: logs in with credentials, re-authenticates on 401
- Thread-safe: multiple threads can log simultaneously
- `atexit` hook ensures remaining logs are sent when the process exits

**Key design decisions:**
- **Batching over individual requests** — Reduces HTTP overhead. A service logging 100 lines/second doesn't make 100 HTTP calls.
- **Background thread** — Logging never blocks the main application thread.
- **Credential-based auth over API keys** — Uses the same JWT auth as the dashboard. The SDK logs in and gets a token automatically.

```
LogEntry buffer (in-memory, thread-safe)
    |
    |  batch_size reached OR flush_interval elapsed
    v
HTTP POST /api/v1/ingest (Bearer JWT)
    |
    |  401? → re-login → retry
    v
Success → buffer cleared
```

---

### 2. FastAPI Backend

**Location:** `app/` | **Framework:** FastAPI + Uvicorn + Python 3.12

The API server handles three responsibilities:

#### a) Log Ingestion (`POST /api/v1/ingest` and `POST /api/v1/logs`)
- Validates JWT token
- Validates project exists
- Publishes log to Redis Streams (non-blocking)
- Returns immediately — does NOT wait for the log to be processed or stored

This is critical: **ingestion is non-blocking**. The API doesn't write to PostgreSQL directly. It appends an event to Redis Streams and returns. This keeps ingestion latency under 5ms regardless of database load.

#### b) Query & Analytics (`GET /api/v1/logs`, `GET /api/v1/logs/analytics`)
- Reads from PostgreSQL
- Supports filtering by project, service, level, time range, text search
- Paginated results (limit/offset)
- Analytics: aggregations by level, by service, error trends over time

#### c) WebSocket Streaming (`WS /api/v1/ws/{project_id}`)
- Accepts WebSocket connection
- Subscribes to Redis Pub/Sub channel for that project
- Streams new logs to the client in real-time

---

### 3. Redis Streams (Event Queue)

**Role:** Decouple ingestion from processing

Redis Streams is used as a lightweight message queue — similar to Kafka but built into Redis.

**Why Redis Streams instead of direct database writes:**
- **Non-blocking ingestion** — API returns instantly after XADD
- **Durability** — Messages persist in Redis until acknowledged
- **Consumer groups** — Multiple workers can process in parallel
- **At-least-once delivery** — If a worker crashes, unacknowledged messages are redelivered
- **Backpressure handling** — If PostgreSQL is slow, logs queue up in Redis instead of failing

**How it works:**

```
API → XADD LOG_STREAM {"data": "{json_payload}"}
                    |
                    v
            Redis Stream: LOG_STREAM
            +---------------------------+
            | msg_id_1 | {log data}     |
            | msg_id_2 | {log data}     |
            | msg_id_3 | {log data}     |
            +---------------------------+
                    |
                    | XREADGROUP (consumer group)
                    v
              Log Worker
                    |
                    | XACK (acknowledge after processing)
                    v
              Message removed from pending
```

---

### 4. Log Worker (Stream Consumer)

**Location:** `app/workers/log_worker.py`

The worker is a long-running process that:

1. **Reads** from Redis Streams using `XREADGROUP` (consumer group: `LOG_CONSUMER_GROUP`)
2. **Parses** the JSON log data into a `LogEntry` domain object
3. **Saves** to PostgreSQL via the `PostgresLogRepository`
4. **Broadcasts** via Redis Pub/Sub to the project's channel (for WebSocket clients)
5. **Acknowledges** the message via `XACK` so Redis doesn't redeliver it

**Consumer group mechanics:**
- Multiple workers can run in parallel, each with a unique consumer name
- Redis distributes messages across consumers (no duplicates)
- If a worker crashes, its pending messages get reassigned
- This enables horizontal scaling — add more workers for higher throughput

**In production deployment (Render free tier):** The worker runs as a background `asyncio.Task` inside the API process itself, since free tier doesn't support separate background workers. In a full deployment, it runs as a separate process via `python -m app.workers.log_worker`.

---

### 5. PostgreSQL (Log Storage)

**Version:** PostgreSQL 16

PostgreSQL stores all log data persistently. The schema is optimized for:
- **Filtering** — Indexed columns for project_id, service, level, timestamp
- **Full-text search** — Text search on log messages
- **JSONB metadata** — Arbitrary structured data attached to each log
- **Analytics** — Aggregation queries for level distribution, error trends, service breakdown

**Why PostgreSQL over specialized log databases:**
- Battle-tested, reliable, widely understood
- JSONB gives schema flexibility for metadata
- Good enough for most organizations' log volumes
- Easy to set up, backup, and maintain
- Can be migrated to ClickHouse/TimescaleDB later if needed

---

### 6. Redis Pub/Sub (Real-time Broadcast)

**Role:** Push new logs to WebSocket clients instantly

When the worker saves a log to PostgreSQL, it also publishes the log data to a Redis Pub/Sub channel named after the project_id.

```
Worker saves log for project "abc-123"
    |
    v
PUBLISH channel="abc-123" data="{log_json}"
    |
    v
All WebSocket clients subscribed to "abc-123" receive it
```

**Why a separate Pub/Sub layer (not just WebSocket directly):**
- Decouples the worker from WebSocket connections
- Multiple API instances can have WebSocket clients — Pub/Sub broadcasts to all
- If no WebSocket clients are connected, the publish is a no-op (no wasted resources)

---

### 7. WebSocket Service

**Location:** `app/api/v1/ws.py`

Provides real-time log streaming to the frontend's "Live Tail" feature.

**Connection flow:**
1. Frontend connects to `ws://server/api/v1/ws/{project_id}`
2. Server accepts the WebSocket connection
3. Server subscribes to Redis Pub/Sub channel for that project
4. When a new log is published to the channel, it's forwarded to the WebSocket client
5. On disconnect, the subscription is cleaned up

Each project has its own channel — clients only receive logs for the project they're viewing.

---

### 8. Next.js Frontend

**Location:** `frontend/` | **Framework:** Next.js 16 + TypeScript + Tailwind CSS

The dashboard provides four main views:

#### Dashboard (Overview)
- Total log count, error count, active services
- Log level distribution (pie chart)
- Error trend over time (line chart)
- Service breakdown (bar chart)
- Recent logs table

#### Log Explorer
- Full-text search across log messages
- Filters: service, level, time range
- Paginated results table
- Expandable rows showing metadata and trace_id

#### Live Tail
- Real-time WebSocket-powered log stream
- Color-coded by log level (green=INFO, yellow=WARNING, red=ERROR, etc.)
- Pause/resume streaming
- Filter by log level
- Auto-scroll with manual scroll lock

#### Analytics
- Error rate percentage
- Log distribution by level
- Per-service volume breakdown
- Error trend over time

**State management:** TanStack React Query for server state (caching, refetching, pagination). React Context for client state (auth, project selection, sidebar).

**Deployment:** Static export to Netlify (fully client-side, no server-side rendering needed).

---

## Data Flow — End to End

Here's the complete journey of a single log, from developer's code to the dashboard:

```
STEP 1: Developer writes code
    logger.error("Payment failed", metadata={"order_id": "123"})

STEP 2: SDK buffers the log
    LogEntry added to in-memory thread-safe buffer

STEP 3: SDK flushes (batch_size or flush_interval)
    HTTP POST /api/v1/ingest
    Body: {
        "project_id": "uuid",
        "trace_id": "uuid",
        "service": "payment-service",
        "level": "ERROR",
        "message": "Payment failed",
        "metadata": {"order_id": "123"},
        "timestamp": "2026-04-03T08:00:00Z"
    }
    Header: Authorization: Bearer <jwt_token>

STEP 4: API validates and queues
    - Decode JWT → valid
    - Project exists → yes
    - XADD to Redis Streams
    - Return {"status": "success"} (< 5ms)

STEP 5: Worker consumes from Redis Streams
    - XREADGROUP reads the message
    - Parse JSON → LogEntry domain object

STEP 6: Worker saves to PostgreSQL
    - INSERT INTO logs (project_id, trace_id, service, level, message, metadata, timestamp)

STEP 7: Worker broadcasts via Pub/Sub
    - PUBLISH channel="{project_id}" data="{log_json}"

STEP 8: WebSocket forwards to frontend
    - Pub/Sub listener receives the message
    - WebSocket sends JSON to connected browser

STEP 9: Dashboard renders the log
    - Live Tail: log appears in real-time stream
    - Log Explorer: log appears in search results
    - Dashboard: counters and charts update
    - Analytics: error trends reflect the new data
```

**Total latency (SDK → Dashboard):** Typically under 100ms.

---

## Multi-Tenancy Architecture

OrgLog is built for multi-tenant usage from the ground up. Here's how isolation works:

### Tenant Hierarchy

```
Organization (tenant boundary)
    |
    +-- User 1 (sujal@think41.com)
    +-- User 2 (rahul@think41.com)
    +-- User 3 (priya@think41.com)
    |
    +-- Project A (payment-service)
    |       +-- Logs for payment-service
    |
    +-- Project B (user-service)
    |       +-- Logs for user-service
    |
    +-- Project C (notification-service)
            +-- Logs for notification-service
```

### Isolation Enforcement

**Organization** is the top-level tenant boundary:
- Every user belongs to exactly one organization
- Every project belongs to exactly one organization
- Every log belongs to a project (and transitively, to an organization)

**Access control is enforced at every layer:**

| Layer | How isolation is enforced |
|-------|--------------------------|
| **Registration** | Email domain determines organization (e.g., `@think41.com` → Think41 org). The org is auto-created if it doesn't exist. |
| **Login** | JWT token encodes the user_id. User lookup reveals the organization_id. |
| **Project creation** | Projects are created under the logged-in user's organization. |
| **Project listing** | `GET /projects` only returns projects where `organization_id = user.organization_id`. |
| **Log ingestion** | `POST /logs` validates that the project belongs to the user's org before accepting the log. |
| **Log search** | `GET /logs` validates project access before returning results. |
| **Analytics** | Same project access validation. |
| **WebSocket** | Streams are per-project. Only logs for the subscribed project are received. |

**No user can ever see another organization's data.** Every query that touches logs or projects passes through `validate_project_access()`:

```python
async def validate_project_access(self, project_id, organization_id):
    project = await self.project_repo.find_by_id_and_org_id(project_id, organization_id)
    if not project:
        raise HTTPException(status_code=403, detail="You do not have access to this project")
    return project
```

### Cross-tenant isolation in the database

There is no shared data between organizations. The foreign key chain ensures this:

```
organizations.id ← users.organization_id
organizations.id ← projects.organization_id
projects.id ← logs.project_id
```

A SQL query for logs always filters by `project_id`, and project access is always validated against the user's `organization_id`.

---

## Authentication System

### Flow

```
Register                          Login
   |                                |
   v                                v
POST /auth/register              POST /auth/login
{name, email_prefix, password}   {email_prefix, password}
   |                                |
   v                                v
- Append org domain to email     - Lookup user by email
  (e.g., "sujal" → "sujal@think41.com")
- Hash password (bcrypt)         - Verify password (bcrypt)
- Get/create organization        - Generate access token (JWT, 30min)
- Create user record             - Generate refresh token (JWT, 7 days)
   |                                |
   v                                v
Return user object               Return access_token in body
                                  Set refresh_token as HttpOnly cookie
```

### Token Design

| Token | Lifetime | Storage | Purpose |
|-------|----------|---------|---------|
| Access Token | 30 minutes | Response body → localStorage (frontend) or SDK memory | API authentication |
| Refresh Token | 7 days | HttpOnly cookie (browser) | Get new access token without re-login |

**Access Token payload:**
```json
{
  "sub": "user-uuid",
  "exp": 1735689600,
  "type": "access"
}
```

### SDK Authentication

The Python SDK handles auth transparently:
1. On initialization: logs in with email_prefix + password → stores access token
2. On every request: sends `Authorization: Bearer <access_token>`
3. On 401 response: re-logs in automatically → retries the request
4. Token refresh is handled by re-login (SDK doesn't use cookies)

---

## Database Schema

```
+-------------------+       +-------------------+
|   organizations   |       |       users       |
+-------------------+       +-------------------+
| id (UUID, PK)     |<------| id (UUID, PK)     |
| name (VARCHAR)    |       | name (VARCHAR)    |
| domain (VARCHAR,  |       | email (VARCHAR,   |
|        UNIQUE)    |       |       UNIQUE)     |
| created_at        |       | password_hash     |
| updated_at        |       | organization_id   |--+
+-------------------+       | created_at        |  |
        |                   | updated_at        |  |
        |                   +-------------------+  |
        |                                          |
        |  1:N                                     |
        v                                          |
+-------------------+                              |
|     projects      |                              |
+-------------------+                              |
| id (UUID, PK)     |                              |
| name (VARCHAR)    |                              |
| organization_id   |------------------------------+
| created_at        |       (FK to organizations)
| updated_at        |
+-------------------+
        |
        |  1:N
        v
+-------------------+
|       logs        |
+-------------------+
| id (UUID, PK)     |
| project_id (UUID) |--- FK to projects
| trace_id (UUID)   |
| service (VARCHAR)  |
| level (VARCHAR)    |--- DEBUG|INFO|WARNING|ERROR|CRITICAL
| message (TEXT)     |
| metadata (JSONB)   |--- arbitrary structured data
| timestamp (TIMESTAMPTZ) |
| created_at         |
| updated_at         |
+-------------------+
```

### Key indexes

- `logs.project_id` — All queries filter by project
- `logs.timestamp` — Time-range queries
- `logs.level` — Level filtering
- `logs.service` — Service filtering
- `users.email` — Login lookup (unique)
- `organizations.domain` — Org lookup (unique)

### JSONB metadata

The `metadata` column uses PostgreSQL's JSONB type, allowing developers to attach arbitrary structured data:

```python
logger.error("Request failed", metadata={
    "status_code": 503,
    "endpoint": "/api/users",
    "response_time_ms": 2500,
    "retry_count": 3,
    "user_id": "usr_abc123",
})
```

This metadata is fully searchable and visible in the log explorer.

---

## Software Architecture Patterns

### Hexagonal Architecture (Ports & Adapters)

OrgLog uses a clean hexagonal (ports and adapters) architecture:

```
                    +---------------------------+
                    |       Domain Layer        |
                    |                           |
                    |  LogEntry, LogLevel       |
                    |  (Pure business objects)  |
                    +---------------------------+
                              |
                    +---------------------------+
                    |      Service Layer        |
                    |                           |
                    |  LogIngestionService      |
                    |  LogQueryService          |
                    |  LogAnalyticsService      |
                    |  AuthService              |
                    |  ProjectService           |
                    |                           |
                    |  (Business logic, uses    |
                    |   interfaces/ports only)  |
                    +---------------------------+
                         |              |
              +----------+              +----------+
              |                                    |
    +---------+----------+            +------------+---------+
    |   Interfaces       |            |   Infrastructure     |
    |   (Ports)          |            |   (Adapters)         |
    |                    |            |                      |
    | LogRepository      |<-----------| PostgresLogRepo     |
    | EventPublisher     |<-----------| RedisPublisher      |
    | UserRepository     |<-----------| PostgresUserRepo    |
    | OrgRepository      |<-----------| PostgresOrgRepo     |
    | ProjectRepository  |<-----------| PostgresProjectRepo |
    +--------------------+            +--------------------+
```

**Why this matters:**
- Services depend on **interfaces**, not concrete implementations
- You can swap PostgreSQL for ClickHouse by implementing a new `LogRepository`
- You can swap Redis Streams for Kafka by implementing a new `EventPublisher`
- Easy to test: mock the interfaces in unit tests

### Dependency Injection

FastAPI's `Depends()` system wires everything together:

```python
# dependencies.py
async def get_log_ingestion_service(...):
    publisher = RedisPublisher(redis_client)
    return LogIngestionService(publisher)

# routes
@router.post("/logs")
async def create_log(
    service: LogIngestionService = Depends(get_log_ingestion_service),
):
    await service.ingest_log(request)
```

### Repository Pattern

Data access is abstracted behind repository interfaces:

```python
# Interface (port)
class LogRepository(ABC):
    @abstractmethod
    async def save(self, log: LogEntry): ...
    @abstractmethod
    async def search(self, query: LogQuery): ...
    @abstractmethod
    async def get_analytics(self, project_id: UUID): ...

# Implementation (adapter)
class PostgresLogRepository(LogRepository):
    async def save(self, log: LogEntry):
        # SQLAlchemy INSERT
    async def search(self, query: LogQuery):
        # SQLAlchemy SELECT with filters
```

---

## API Design

### Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/auth/register` | No | Register user (auto-creates org) |
| `POST` | `/api/v1/auth/login` | No | Login (returns JWT + sets cookie) |
| `POST` | `/api/v1/auth/refresh` | Cookie | Refresh access token |
| `POST` | `/api/v1/auth/logout` | No | Clear refresh cookie |
| `GET` | `/api/v1/auth/me` | JWT | Get current user profile |
| `POST` | `/api/v1/projects` | JWT | Create project |
| `GET` | `/api/v1/projects` | JWT | List user's projects |
| `GET` | `/api/v1/projects/{id}` | JWT | Get project details |
| `POST` | `/api/v1/logs` | JWT | Ingest log (internal, with org validation) |
| `POST` | `/api/v1/ingest` | JWT | Ingest log (SDK endpoint) |
| `GET` | `/api/v1/logs` | JWT | Search logs with filters |
| `GET` | `/api/v1/logs/analytics` | JWT | Get analytics aggregations |
| `GET` | `/api/v1/health` | No | Health check |
| `WS` | `/api/v1/ws/{project_id}` | No | Real-time log stream |

### Two Ingestion Endpoints

- **`POST /api/v1/logs`** — Used internally (from the dashboard). Validates that the project belongs to the user's org.
- **`POST /api/v1/ingest`** — Used by the SDK. Validates the JWT token and that the project exists (without org-level check, since the SDK authenticates as a user who already belongs to an org).

---

## Frontend Architecture

```
frontend/src/
    |
    +-- app/                         (Next.js App Router)
    |   +-- page.tsx                 (Landing page)
    |   +-- login/page.tsx           (Login form)
    |   +-- register/page.tsx        (Registration form)
    |   +-- dashboard/
    |       +-- layout.tsx           (Sidebar + Header wrapper)
    |       +-- page.tsx             (Dashboard overview)
    |       +-- logs/page.tsx        (Log explorer)
    |       +-- live/page.tsx        (Live tail)
    |       +-- analytics/page.tsx   (Analytics charts)
    |
    +-- components/
    |   +-- ui/                      (Radix UI primitives: Button, Card, Badge, etc.)
    |   +-- layout/                  (Header, Sidebar, Navigation)
    |   +-- dashboard/               (StatCard, Charts, LogTable)
    |   +-- logs/                    (Filters, LogTable, LiveStream)
    |
    +-- lib/
        +-- api/                     (HTTP client layer)
        |   +-- client.ts            (Fetch wrapper with auth, error handling)
        |   +-- auth.ts              (Login, register, refresh)
        |   +-- logs.ts              (Search, analytics)
        |   +-- projects.ts          (CRUD)
        |
        +-- providers/               (React Context)
        |   +-- auth-provider.tsx     (JWT token management)
        |   +-- project-provider.tsx  (Current project selection)
        |   +-- query-provider.tsx    (TanStack React Query)
        |   +-- live-logs-provider.tsx (WebSocket connection)
        |   +-- sidebar-provider.tsx  (UI state)
        |
        +-- hooks/                   (Custom React hooks)
        +-- types/                   (TypeScript interfaces)
        +-- constants/               (Config, endpoints, design tokens)
        +-- utils/                   (Formatters, helpers)
```

### Key Frontend Patterns

- **All pages are client-side** (`"use client"`) — no server-side rendering needed since all data comes from the API
- **TanStack React Query** handles server state: caching, background refetching, pagination
- **WebSocket connection** is managed by a React Context provider — connect once, share across components
- **Project selection** is global state — changing the project updates all data across all pages
- **Static export** — the entire frontend builds to static HTML/JS, deployable on any CDN (Netlify, Vercel, S3)

---

## Deployment Architecture

### Current Production Setup

```
+------------------+          +------------------+
|   Netlify        |          |   Render         |
|                  |          |                  |
|   Static Next.js |  HTTPS   |   FastAPI API    |
|   Dashboard      +--------->|   + Log Worker   |
|                  |          |   (single process)|
+------------------+          +--------+---------+
                                       |
                              +--------+---------+
                              |                  |
                    +---------+---+    +---------+---+
                    |   Render    |    |   Render    |
                    |   PostgreSQL|    |   Redis     |
                    |   (Free)   |    |   (Free)    |
                    +-------------+    +-------------+
```

### Full-Scale Setup (docker-compose)

```
                              +-------------------+
                              |   Nginx / LB      |
                              +--------+----------+
                                       |
                    +------------------+------------------+
                    |                                     |
          +---------+---+                       +---------+---+
          |   API       |                       |   API       |
          |   Instance 1|                       |   Instance 2|
          +------+------+                       +------+------+
                 |                                     |
                 +------------------+------------------+
                                    |
                 +------------------+------------------+
                 |                                     |
          +------+------+                     +--------+----+
          |   Worker 1  |                     |   Worker 2  |
          | (consumer   |                     | (consumer   |
          |  group)     |                     |  group)     |
          +------+------+                     +------+------+
                 |                                   |
          +------+------+                   +--------+----+
          |  PostgreSQL |                   |    Redis    |
          |  (Primary)  |                   |  (Cluster)  |
          +-------------+                   +-------------+
```

---

## Scalability & Performance

### Current Capacity (single-node)

| Metric | Capacity |
|--------|----------|
| Ingestion throughput | ~1,000 logs/second |
| Search latency | < 100ms (with indexes) |
| WebSocket connections | ~1,000 concurrent |
| Storage | Limited by PostgreSQL disk |

### Horizontal Scaling Path

| Component | How to scale |
|-----------|-------------|
| **API** | Run multiple instances behind a load balancer. All instances are stateless. |
| **Workers** | Add more workers to the consumer group. Redis distributes messages automatically. |
| **PostgreSQL** | Read replicas for search queries. Partitioning by timestamp for large volumes. |
| **Redis** | Redis Cluster for high-throughput streaming. |
| **Frontend** | Already static — served from CDN, scales infinitely. |

### Future Scaling Options

- **Redis Streams → Kafka** — For volumes exceeding what Redis can handle (millions of logs/second)
- **PostgreSQL → ClickHouse** — Columnar storage optimized for log analytics at petabyte scale
- **Cold storage → S3** — Archive old logs to object storage, keep recent logs in PostgreSQL
- **Elasticsearch** — Add a search layer for full-text search at scale

The hexagonal architecture makes these swaps straightforward — implement a new adapter, swap the dependency injection.

---

## Security Model

| Layer | Mechanism |
|-------|-----------|
| **Authentication** | JWT tokens (access + refresh) with bcrypt password hashing |
| **Authorization** | Organization-scoped access control on every endpoint |
| **Transport** | HTTPS in production |
| **Secrets** | JWT_SECRET via environment variable, never in code |
| **Cookies** | Refresh token stored as HttpOnly cookie (not accessible to JavaScript) |
| **CORS** | Restricted to allowed origins only |
| **Input validation** | Pydantic models validate all request payloads |
| **SQL injection** | SQLAlchemy ORM with parameterized queries |
| **Password storage** | bcrypt with auto-generated salt |

---

## Tech Stack Summary

| Layer | Technology | Why |
|-------|-----------|-----|
| **SDK** | Python + httpx | Lightweight, async-capable HTTP client |
| **API** | FastAPI + Uvicorn | Async Python, auto-docs, dependency injection, high performance |
| **Event Queue** | Redis Streams | Lightweight Kafka alternative, consumer groups, at-least-once delivery |
| **Database** | PostgreSQL 16 | Battle-tested, JSONB for flexible metadata, good analytics performance |
| **Real-time** | Redis Pub/Sub + WebSockets | Low-latency broadcast to dashboard clients |
| **ORM** | SQLAlchemy 2.0 (async) | Industry standard, async support, Alembic migrations |
| **Frontend** | Next.js 16 + TypeScript | React ecosystem, App Router, static export |
| **Styling** | Tailwind CSS 4 | Utility-first, fast iteration |
| **Charts** | Recharts | React-native charting, good defaults |
| **UI Primitives** | Radix UI | Accessible, unstyled, composable |
| **State** | TanStack React Query | Server state management, caching, refetching |
| **Deployment** | Docker + Netlify + Render | Containerized backend, static frontend CDN |

---

## Why These Choices

### Why Redis Streams over Kafka?
Kafka is the gold standard for event streaming but requires ZooKeeper, brokers, and significant operational overhead. Redis Streams provides the same consumer group semantics (at-least-once delivery, parallel consumers, message acknowledgment) with zero additional infrastructure — Redis is already needed for Pub/Sub. For organizations processing under 10,000 logs/second, Redis Streams is the pragmatic choice. The architecture is designed so that migrating to Kafka requires only implementing a new `EventPublisher` adapter.

### Why PostgreSQL over ClickHouse/Elasticsearch?
ClickHouse is faster for analytical queries at massive scale, and Elasticsearch is better for full-text search. But PostgreSQL handles both adequately for most organizations' log volumes (millions of logs). It's simpler to operate, widely understood, and JSONB gives us schema flexibility. The repository pattern allows swapping the storage engine later without changing any business logic.

### Why a Python SDK first?
Most backend services in typical organizations are Python (FastAPI, Django, Flask). The SDK follows the principle of least effort — `pip install orglog`, add 3 lines of code, and you're done. A JavaScript/TypeScript SDK would be the natural next step for Node.js services.

### Why static export for the frontend?
The dashboard is a pure client-side application — all data comes from the API. There's no need for server-side rendering or server components. Static export means the frontend can be deployed to any CDN (Netlify, Vercel, S3, GitHub Pages) with zero server costs and infinite scalability.

### Why separate ingestion from processing?
Decoupling ingestion (API) from processing (Worker) via an event queue is the core architectural decision. It means:
- Ingestion never blocks, regardless of database load
- The system degrades gracefully under load (logs queue up instead of failing)
- Processing can be scaled independently of ingestion
- A database outage doesn't cause log loss — they wait in Redis
