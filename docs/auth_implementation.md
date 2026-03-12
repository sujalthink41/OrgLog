# Authentication Implementation

## Overview

JWT-based authentication with org-email restriction. Only users with `@think41.com` email can register. Users provide email prefix, system appends the org domain.

## Architecture (Router -> Service -> Repository)

```
Router (auth.py)
  │  handles HTTP, cookies, response
  │
  ▼
Service (auth_service.py)
  │  business logic: register, login, token generation
  │  depends on UserRepository + OrganizationRepository (interfaces)
  │
  ▼
Repository (postgres_user_repository.py, postgres_organization_repository.py)
  │  pure database queries, no business logic
  │
  ▼
Database (PostgreSQL)
```

## Auth Flow

```
Register: POST /api/v1/auth/register
  → User sends: name, email_prefix, password
  → System creates: user with email = prefix@think41.com
  → Returns: user info

Login: POST /api/v1/auth/login
  → User sends: email_prefix, password
  → System verifies password against bcrypt hash
  → Returns: access_token (in JSON) + refresh_token (in HttpOnly cookie)

Refresh: POST /api/v1/auth/refresh
  → System reads refresh_token from cookie
  → Validates token type + expiry
  → Returns: new access_token

Me: GET /api/v1/auth/me
  → Requires: Authorization: Bearer <access_token>
  → Returns: current user info

Logout: POST /api/v1/auth/logout
  → Clears refresh_token cookie
```

## Files

### Interfaces (Ports)
- `app/interfaces/user_repository.py` — abstract: find_by_email, find_by_id, create
- `app/interfaces/organization_repository.py` — abstract: find_by_domain, create

### Infrastructure (Adapters)
- `app/infrastructure/postgres_user_repository.py` — SQLAlchemy implementation
- `app/infrastructure/postgres_organization_repository.py` — SQLAlchemy implementation

### Service Layer
- `app/services/auth_service.py` — register, login, get_user_by_id, org auto-creation

### API Layer
- `app/api/v1/auth.py` — routes: register, login, refresh, logout, me

### Utilities
- `app/core/security.py` — password hashing (bcrypt) + JWT (PyJWT)
- `app/utils/email.py` — build_org_email helper

### Models
- `app/data/models/organization_model.py` — Organization table
- `app/data/models/user_model.py` — User table
- `app/data/models/project_model.py` — Project table

### Dependencies
- `app/core/dependencies.py` — get_auth_service, get_current_user

## How to Test

```bash
# 1. Run migration
docker compose exec api alembic upgrade head

# 2. Register
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email_prefix":"test","password":"password123"}'

# 3. Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email_prefix":"test","password":"password123"}'

# 4. Access protected route
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer <paste_access_token_here>"
```
