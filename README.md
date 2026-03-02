# Pub League Platform (Monorepo Skeleton)
Generated: 2026-02-12

This is a starter scaffold aligned to the documentation pack.

## Stack
- Web: Next.js (App Router) + TypeScript
- API: NestJS + TypeScript
- DB: PostgreSQL (Docker)
- Cache/Queue: Redis (Docker)
- ORM/Migrations: Prisma (in `apps/api/prisma`)

## Quick start (local)
1. Install Node.js 20+.
2. From repo root:
   - `npm install`
   - `docker compose up --build -d`

Web: http://localhost:3000  
API: http://localhost:4000 (health: `/api/v1/health`)

## Environment
Copy env files:
- `cp apps/api/.env.example apps/api/.env`
- `cp apps/web/.env.example apps/web/.env`

## Notes
- This is a minimal skeleton. Modules/controllers are placeholders so Codex/Claude Code can fill in.
- Multi-tenancy enforced by `organisationId` in schema and request scoping (to be implemented).
- Canonical pivot roadmap: `/PubLeague_Program_Schedule_Roadmap_v1.md`
- Latest status + next action: `/CHATGPT_NEXT_STEP_NOTE.md`
- Runtime note: Docker compose now defines `postgres`, `redis`, `api`, and `web`.
- API container startup runs `prisma migrate deploy` before boot.
- Verification note: live `docker compose` validation completed on 2026-03-02 with healthy `postgres`, `redis`, `api`, and `web` services.
- Remaining runtime note: migration-job upload assets are currently written to container-local filesystem and are not yet backed by persistent storage.
