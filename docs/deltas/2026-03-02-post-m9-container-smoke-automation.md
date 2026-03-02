# Delta: Post-M9 Container Smoke Automation
Date: 2026-03-02

Implementation status:
- Implemented on 2026-03-02.
- Validation completed locally.

## What changes
Add a narrow operational smoke path that verifies the container baseline established by the post-M9 runtime-hardening delta. The scope is limited to scripted local validation and documentation cleanup around the known-good `docker compose` startup path. This is not new product functionality and does not extend league/domain scope.

## Why
The application now boots successfully via Docker with healthy `postgres`, `redis`, `api`, and `web` services, but the validation is still manual. Without a repeatable smoke path, the project can regress on container startup, migration-first boot, or SSR API wiring without an obvious signal.

This delta keeps the newly validated runtime path durable before any future product expansion.

## Impacted modules/files
- `package.json` or a narrow repo-level script entry for container smoke execution
- optional lightweight script under `scripts/` for:
  - `docker compose up --build -d`
  - API/web health checks
  - `docker compose down`
- `apps/api/src/modules/migration-jobs/migration-jobs.service.ts`
- `docker-compose.yml`
- `README.md`
- `docs/deltas/2026-03-02-post-m9-runtime-hardening-and-app-containers.md`
- a short session note documenting the automation closeout

## DB changes required
- No schema changes.
- No new domain migrations.

## Test additions required
- one repeatable operational smoke path that verifies:
  - `prisma migrate deploy` succeeds in container startup
  - `GET /api/v1/health` returns success
  - web root responds successfully
- keep this separate from domain e2e coverage; it is runtime validation, not business-logic testing

## Cost
- No milestone sequencing shift.
- Small operational follow-on only.
- Preserves the post-M9 container baseline and reduces regression risk before any new feature delta.

## Validation closeout
Completed on 2026-03-02 with:
- `npm run smoke:containers`
- scripted `docker compose up --build -d`
- scripted API health verification
- scripted web root verification
- scripted `docker compose ps`
- scripted `docker compose down`
- configurable API upload root plus Docker-backed upload volume
- focused persistence verification:
  - wrote a sentinel file under `/data/uploads`
  - restarted the API container
  - read the same file back successfully after restart
- script-level Docker Desktop reliability handling:
  - resolves Docker CLI from PATH or standard Docker Desktop install path
  - prepends Docker Desktop bin path so credential helpers resolve
  - starts from `docker compose down --remove-orphans`
  - forces classic builder mode for this smoke path because BuildKit snapshot export proved flaky on this machine

Residual runtime note:
- Docker-backed persistence is now in place for local container runtime.
- Broader long-term storage design, if needed later, should be introduced only through a new explicit delta.
