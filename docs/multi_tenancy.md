# Multi-Tenancy Implementation

## Overview

Organization-scoped multi-tenancy. Every user belongs to an organization, every project belongs to an organization, and every log belongs to a project. Users can only access projects and logs within their own organization.

## Data Model

```
Organization (tenant boundary)
  │
  ├── Users (belong to one org)
  │
  └── Projects (belong to one org)
       │
       └── Logs (belong to one project)
```

## Architecture (Router → Service → Repository)

```
Router (projects.py, logs.py)
  │  handles HTTP, auth injection, response formatting
  │
  ▼
Service (project_service.py, log_*_service.py)
  │  business logic: CRUD, access validation
  │  depends on ProjectRepository (interface)
  │
  ▼
Repository (postgres_project_repository.py)
  │  pure database queries, no business logic
  │
  ▼
Database (PostgreSQL)
```

## Tenant Isolation Flow

```
1. User authenticates → JWT contains user_id
2. get_current_user extracts user from DB → gives organization_id
3. All operations validate: does this project belong to user's org?
4. If not → 403 Forbidden (log endpoints) or 404 Not Found (project endpoints)
```

## Project API

### Create Project
```
POST /api/v1/projects
Authorization: Bearer <access_token>
Body: {"name": "MyProject"}
→ Creates project under the authenticated user's organization
```

### List Projects
```
GET /api/v1/projects
Authorization: Bearer <access_token>
→ Returns all projects in the user's organization
```

### Get Project
```
GET /api/v1/projects/{project_id}
Authorization: Bearer <access_token>
→ Returns project details (only if it belongs to user's org)
```

## Protected Log Endpoints

All log endpoints now require authentication and validate project ownership:

```
POST /api/v1/logs          → requires auth + project must belong to user's org
GET  /api/v1/logs          → requires auth + project_id must belong to user's org
GET  /api/v1/logs/analytics → requires auth + project_id must belong to user's org
```

## Files

### Interfaces (Ports)
- `app/interfaces/project_repository.py` — abstract: find_by_id, find_by_id_and_org_id, find_all_by_org_id, create

### Infrastructure (Adapters)
- `app/infrastructure/postgres_project_repository.py` — SQLAlchemy implementation

### Service Layer
- `app/services/project_service.py` — create_project, list_projects, get_project, validate_project_access

### API Layer
- `app/api/v1/projects.py` — routes: create, list, get (all auth-protected)
- `app/api/v1/logs.py` — all routes now auth-protected with project access validation

### Schemas
- `app/schemas/project.py` — CreateProjectRequest, ProjectResponse

### Dependencies
- `app/core/dependencies.py` — get_project_service

## How to Test

```bash
# 1. Login to get access token
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email_prefix":"sujal","password":"your_password"}'

# 2. Create a project
curl -X POST http://localhost:8000/api/v1/projects \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"MyProject"}'

# 3. List projects in your org
curl http://localhost:8000/api/v1/projects \
  -H "Authorization: Bearer <token>"

# 4. Send a log (must use a project_id from your org)
curl -X POST http://localhost:8000/api/v1/logs \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"project_id":"<project_id>","trace_id":"...", "service":"api","level":"INFO","message":"test"}'

# 5. Query logs (project must belong to your org)
curl "http://localhost:8000/api/v1/logs?project_id=<project_id>" \
  -H "Authorization: Bearer <token>"
```
