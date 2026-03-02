# Delta: Post-M9 Runtime Hardening and App Containers
Date: 2026-03-02

Implementation status:
- Container definitions and supporting code were implemented on 2026-03-02.
- Local code validation passed.
- Live `docker compose` validation completed on 2026-03-02.
- Delta closeout fixes were required during validation:
  - API container base image changed to `node:20-bookworm-slim` for Prisma runtime compatibility
  - API runtime image now includes `wget` for health checks
  - API builder image now includes Python/build tools for resilient native module installs
  - transfer migration bootstrap path was repaired so a fresh database can create `RosterTransferAudit` before altering it

## What changes
After Milestone 9, the next scoped work is not a new product feature. It is a runtime-hardening slice focused on making local and deployment behavior more trustworthy:
- add first-class Docker app containers for API and web
- make migration-first startup the default path
- verify the app boots end-to-end against containerized Postgres/Redis
- tighten operational docs around container startup, health checks, and failure visibility

This is a delivery/infrastructure hardening delta, not a domain-model expansion.

## Why
The current roadmap-defined feature work is complete through Milestone 9, but runtime confidence is still weaker than code-level confidence:
- `docker-compose.yml` only defines Postgres and Redis
- API and web are still expected to run outside Docker
- the repo has moved to migration-first flow, while some older bootstrap docs still mention `db:push`
- this execution environment could not inspect live container state because `docker` CLI was unavailable, which reinforces the need for clearer containerized operational paths

If we progress to further feature work without hardening runtime behavior, failures will shift from logic bugs to deployment/boot drift.

## Impacted modules/files
- `docker-compose.yml`
- repo root `README.md`
- `apps/api/Dockerfile` (new)
- `apps/web/Dockerfile` (new)
- optional compose env wiring for API/web runtime vars
- health/startup docs and session handoff docs
- optional startup scripts if needed for migration + boot order

## DB changes required
- No schema change is required for this delta.
- Startup flow must use migration-first commands against existing Prisma migrations.

## Test additions required
- container boot validation checklist documented
- at minimum:
  - API health responds from containerized runtime
  - web boots against containerized API
  - migration deploy path succeeds before API startup
- if lightweight automation is added, keep it narrow and operational:
  - smoke script for `docker compose up` + health checks

## Validation closeout
Completed on 2026-03-02 with:
- `docker compose up --build -d`
- `docker compose ps`
- `GET http://localhost:4000/api/v1/health` returned `{"ok":true}`
- `GET http://localhost:3000` returned `200`

Validated services:
- `postgres`
- `redis`
- `api`
- `web`

## Cost
- This does not shift domain milestone sequencing because the current roadmap has no defined Milestone 10 yet.
- It creates the post-M9 baseline that future roadmap work should build on.
