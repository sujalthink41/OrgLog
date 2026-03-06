# OrgLog — Version 1 Scope Definition

## Document Purpose

This document strictly defines what is included and excluded in OrgLog v1.

The goal of v1 is to deliver a **production-ready internal centralized logging platform** with multi-tenant support and real-time log visibility.

Anything not listed under “Included” is considered out of scope for v1.

---

# 1. 🎯 Vision of Version 1

OrgLog v1 provides:

* Centralized log ingestion
* Reliable event-driven processing
* Structured storage optimized for querying
* Real-time log streaming
* Basic filtering and error analytics
* Multi-tenant isolation
* Production-grade security controls

This version is designed to be stable, scalable, and deployable within the organization.

---

# 2. ✅ In-Scope Features (v1)

## 2.1 Log Ingestion API

### Endpoint

`POST /v1/logs`

### Requirements

* Accept structured JSON logs
* Authenticate via API Key (Bearer token)
* Validate required fields
* Enforce payload size limit
* Push logs into Redis Streams
* Return immediately (non-blocking)

### Required Log Fields

* service (string)
* level (enum: DEBUG, INFO, WARNING, ERROR, CRITICAL)
* message (string)
* timestamp (optional — default to server time)
* metadata (JSON object, optional)
* trace_id (optional)

---

## 2.2 Multi-Tenant Architecture

### Entities

* Organization
* Project
* API Key

### Rules

* Every log must belong to a project
* API key maps to a single project
* Strict isolation of logs by project_id
* No cross-project queries

---

## 2.3 Event-Driven Processing

* Use Redis Streams
* Use Consumer Groups
* Support log replay capability
* Ensure at-least-once delivery
* Worker service processes logs asynchronously

---

## 2.4 Log Storage

### Primary Log Storage: ClickHouse

Must support:

* High write throughput
* Time-based partitioning
* Filtering by:

  * project_id
  * service
  * level
  * time range
  * full-text message search (basic LIKE)

### Schema Requirements

* timestamp
* project_id
* service
* level
* message
* trace_id
* metadata (JSON)

---

## 2.5 Search API

### Endpoint

`GET /v1/logs`

### Supported Filters

* project_id (implicit via API key)
* service
* level
* start_time
* end_time
* search_text

### Pagination

* Limit + offset
* Maximum limit enforced

---

## 2.6 Real-Time Log Streaming

### WebSocket Endpoint

`/ws/{project_id}`

Requirements:

* Authenticate connection
* Stream logs in near real-time
* Only stream logs for that project
* Use Redis Pub/Sub for broadcasting

---

## 2.7 Basic Error Analytics

System must provide:

* Error count per minute (per project)
* Aggregation by:

  * service
  * level

No advanced anomaly detection in v1.

---

## 2.8 Rate Limiting

* Redis-based rate limiting
* Configurable per API key
* Enforce logs-per-minute threshold
* Reject requests exceeding limits

---

## 2.9 Security Controls

* Store hashed API keys (never plaintext)
* Payload validation using Pydantic
* Maximum metadata size enforcement
* Maximum log message length enforcement
* TLS required in production
* No public anonymous endpoints

---

## 2.10 Observability of OrgLog Itself

Expose metrics for:

* Logs per second
* Worker lag
* Queue depth
* API latency
* Error rate

Metrics must be exportable for monitoring systems.

---

# 3. ❌ Out of Scope for v1

The following features are explicitly excluded:

* Kafka integration
* Distributed ClickHouse cluster
* AI-based anomaly detection
* Distributed tracing system
* Alert notification system (Slack, Email, etc.)
* Cold storage (S3)
* Long-term retention policies
* Role-based access control (beyond API key level)
* UI dashboard (API + WebSocket only in v1)
* Log sampling
* Schema registry
* Log transformation pipelines
* Cross-project querying
* Multi-region deployment

These may be implemented in future versions.

---

# 4. 🧱 Non-Functional Requirements

## 4.1 Performance

* Handle at least 1,000 logs/second (single-node deployment)
* API response time < 50ms (excluding network latency)
* Worker processing delay < 2 seconds

## 4.2 Reliability

* No log loss under normal operation
* Redis Stream replay capability
* Graceful worker restarts

## 4.3 Scalability

* Horizontal scaling of ingestion service
* Horizontal scaling of workers
* Stateless API services

## 4.4 Maintainability

* Modular service structure
* Clear separation of ingestion, worker, and streaming services
* Dockerized environment

---

# 5. 📦 Deliverables of Version 1

By completion of v1, the system must provide:

* Running ingestion service
* Running worker service
* ClickHouse storage integration
* Redis Streams integration
* Search API
* WebSocket streaming
* API key management
* Rate limiting
* Deployment via Docker Compose

---

# 6. 🎯 Success Criteria

v1 is considered successful if:

* Multiple internal services can send logs
* Logs are searchable within seconds
* Logs can be streamed live
* System handles sustained log traffic
* Logs are isolated per project
* No log loss during normal operations

---

# 7. 🚀 Strategic Outcome

OrgLog v1 establishes:

* A centralized logging backbone
* Event-driven infrastructure foundation
* Internal observability capability
* Cost control over logging growth
* A scalable architecture ready for v2 evolution

---

**Scope Freeze Date:** TBD
**Version:** 1.0
**Status:** Approved for Implementation
