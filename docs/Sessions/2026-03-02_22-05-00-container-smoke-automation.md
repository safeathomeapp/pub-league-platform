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

## Verification
- `npm run smoke:containers` passed on 2026-03-02

## Residual risk
- Migration-job upload assets are still written to container-local filesystem under the API app working directory.
- That storage is not yet backed by a persistent volume or external storage adapter.
