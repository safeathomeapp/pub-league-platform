# Session Overview: Container Smoke Automation

## Date
2026-03-02

## Scope
- Implemented the post-M9 container smoke automation delta.
- Added a repeatable repo-level smoke command for Docker runtime validation.
- Kept scope operational-only with no new product behavior.

## Changes
- Added:
  - `scripts/container-smoke.ps1`
- Updated:
  - `apps/api/src/modules/migration-jobs/migration-jobs.service.ts`
  - `docker-compose.yml`
  - `package.json`
  - `README.md`
  - `docs/deltas/2026-03-02-post-m9-container-smoke-automation.md`

## Runtime behavior
- `npm run smoke:containers` now:
  - resolves the Docker CLI from PATH or standard Docker Desktop install path
  - prepends the Docker Desktop bin directory so credential helpers resolve correctly
  - starts from `docker compose down --remove-orphans`
  - runs `docker compose up --build -d`
  - waits for API health success
  - waits for web root success
  - waits for service health on `postgres`, `redis`, `api`, and `web`
  - prints `docker compose ps`
  - runs `docker compose down` unless `-KeepUp` is supplied directly to the script
  - forces classic builder mode for this smoke path because BuildKit snapshot export was intermittently failing on this machine
- Containerized API uploads now use:
  - `UPLOADS_ROOT=/data`
  - named Docker volume `api_uploads` mounted at `/data/uploads`

## Verification
- `npm run smoke:containers` passed on 2026-03-02
- focused persistence verification passed on 2026-03-02:
  - wrote sentinel file to `/data/uploads`
  - restarted API container
  - verified sentinel file remained present after restart

## Residual note
- Local Docker runtime now persists migration-job uploads across API container restart.
- Any future move to external/object storage should be treated as separate scoped work, not implicit follow-on.
