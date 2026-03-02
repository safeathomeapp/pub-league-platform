# Session Overview: Runtime Hardening and App Containers Implementation

## Date
2026-03-02

## Scope
- Implemented the post-M9 runtime-hardening delta in code.
- Added app Dockerfiles and expanded compose to include API and web services.
- Fixed web server-side API base handling so containerized SSR can use the internal API host.

## Changes
- Added:
  - `.dockerignore`
  - `apps/api/Dockerfile`
  - `apps/web/Dockerfile`
  - `apps/web/lib/server-api.ts`
- Updated:
  - `docker-compose.yml`
  - `apps/web/lib/api.ts`
  - `apps/web/app/page.tsx`
  - `apps/web/.env.example`
  - `README.md`

## Runtime behavior
- Compose now defines:
  - `postgres`
  - `redis`
  - `api`
  - `web`
- API container startup path:
  - `prisma migrate deploy`
  - `node dist/main.js`
- Web container uses:
  - public browser API base: `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1`
  - internal server-side API base: `API_BASE_URL=http://api:4000/api/v1`

## Verification
- `npm --workspace apps/api run build` passed
- `npm --workspace apps/web run typecheck` passed
- `npm --workspace apps/web run test:smoke` passed
- `npm --workspace apps/web run build` passed

## Live Docker validation
Validated on 2026-03-02 after Docker Desktop became available.

Commands run:
- `docker compose up --build -d`
- `docker compose ps`
- `GET http://localhost:4000/api/v1/health`
- `GET http://localhost:3000`

Observed result:
- `postgres` healthy
- `redis` healthy
- `api` healthy
- `web` healthy

## Runtime fixes discovered during validation
- API container image changed from Alpine to Debian slim because Prisma startup failed on the Alpine runtime path.
- API builder image now installs `python3`, `make`, and `g++` so `bcrypt` can fall back to native build when prebuilt binary download is unavailable.
- API runtime image now installs `wget` so the compose health check works in-container.
- Migration `20260224110000_transfer_effective_date` was repaired so fresh-database bootstrap creates `RosterTransferAudit` before altering it.

## Closeout
- The post-M9 runtime-hardening delta is validated locally via Docker.
- No further runtime/container blockers were found after these fixes.
