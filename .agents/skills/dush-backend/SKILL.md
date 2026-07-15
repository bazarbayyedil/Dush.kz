---
name: dush-backend
description: Build, migrate, test, deploy, and operate the Dush.kz FastAPI and PostgreSQL backend. Use for API contracts, product persistence, order handling, admin access, database migrations, Docker services, Nginx API routing, GitHub Actions, and production releases.
---

# Work on the Dush.kz backend

1. Read repository `AGENTS.md`, `backend/AGENTS.md`, and `references/api-contract.md`.
2. Run Python commands from `backend/` and production orchestration from the repository root.
3. Treat PostgreSQL as the source of truth; generated catalog JSON is import input only.
   Store image URL strings only; image bytes live in persistent media or object storage.
4. Resolve product identity and prices in the database when accepting an order.
5. Keep order writes public but order reads and status changes authenticated.
6. Never log customer data, tokens, database URLs, or deployment secrets.
7. Make catalog imports idempotent by slug and deactivate missing products instead of deleting them.

Verify with `python -m ruff check .` and `python -m pytest`. For production changes, also validate Docker Compose and Nginx, then check public HTTPS and `/api/v1/health`.
