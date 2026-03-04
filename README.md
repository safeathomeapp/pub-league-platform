# Pub League Platform
Updated: 2026-03-04

Admin-first league operations platform for UK English 8-ball first, with the current repo state now beyond the original milestone roadmap and operating through explicit deltas.

## Start Here
For current work, use this reading order:
1. `/README.md` for local runtime/bootstrap basics
2. `/docs/PIVOT_INDEX.md` for the canonical docs map
3. `/PubLeague_Program_Schedule_Roadmap_v1.md` for the authoritative roadmap
4. `/CHATGPT_NEXT_STEP_NOTE.md` for current completion status and immediate next delta
5. `/PROJECT_HANDOVER.md` for the concise current repo-state handover

Historical or superseded materials should only be consulted after the files above.

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
   - `npm run db:migrate`
   - `docker compose up --build -d`

Web: http://localhost:3000  
API: http://localhost:4000 (health: `/api/v1/health`)

## Environment
Copy env files:
- `cp apps/api/.env.example apps/api/.env`
- `cp apps/web/.env.example apps/web/.env`

## Notes
- Canonical docs map: `/docs/PIVOT_INDEX.md`
- Canonical pivot roadmap: `/PubLeague_Program_Schedule_Roadmap_v1.md`
- Latest status + next action: `/CHATGPT_NEXT_STEP_NOTE.md`
- Current repo-state handover: `/PROJECT_HANDOVER.md`
- Runtime note: Docker compose now defines `postgres`, `redis`, `api`, and `web`.
- API container startup runs `prisma migrate deploy` before boot.
- Local migration commands:
  - `npm run db:migrate` applies committed migrations non-interactively
  - `npm run db:migrate:create -- --name <slug>` creates a new development migration
- Verification note: live `docker compose` validation completed on 2026-03-02 with healthy `postgres`, `redis`, `api`, and `web` services.
- Container smoke command: `npm run smoke:containers`
- Container smoke behavior:
  - runs `docker compose up --build -d`
  - verifies API health and web root response
  - prints `docker compose ps`
  - runs `docker compose down` when finished
- Migration-job runtime note: containerized API uploads now persist via the `api_uploads` Docker volume mounted at `/data/uploads`.
- Current next-session shortlist:
  - venue-aware scheduling enforcement
  - competition policy enforcement expansion
  - organiser authority model hardening
