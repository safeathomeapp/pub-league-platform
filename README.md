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
   - `docker compose up -d`
   - `npm run db:push`
   - `npm run dev`

Web: http://localhost:3000  
API: http://localhost:4000 (health: `/api/v1/health`)

## Environment
Copy env files:
- `cp apps/api/.env.example apps/api/.env`
- `cp apps/web/.env.example apps/web/.env`

## Notes
- This is a minimal skeleton. Modules/controllers are placeholders so Codex/Claude Code can fill in.
- Multi-tenancy enforced by `organisationId` in schema and request scoping (to be implemented).
