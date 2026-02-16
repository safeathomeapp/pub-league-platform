# 08 Architecture and Tech Stack
Generated: 2026-02-12

## Stack (recommended)
Frontend:
- Next.js + TypeScript
- PWA installable
- Capacitor wrapper for App Store / Play Store distribution (later)

Backend:
- NestJS + TypeScript
- PostgreSQL
- Redis (queues, rate limits, presence)
- WebSockets (Nest gateway)

Workers:
- Notification sender worker
- Standings/stats recompute worker (can be same worker queue initially)

## Architecture overview
- API service handles user requests and writes to match_event_log + domain tables.
- Background workers handle:
  - notifications_outbox dispatch
  - standings snapshot recompute jobs
- WebSocket broadcasts updates for live UI.

## Event ledger approach
- Client submits events with expected_revision.
- Server validates permission + revision continuity.
- Server appends event, increments revision.
- Server enqueues recompute job for affected division.

## Deployment (local-first)
- Docker compose for postgres + redis + api + web.
- Later SaaS: container deploy to a managed platform.

## Observability (MVP)
- Structured JSON logs
- Correlation IDs per request
- Admin endpoints to view failed notifications and last errors

## Offline (Phase 2)
- Client keeps local event queue for fixtures in progress.
- Sync with revision checks; conflicts resolved by commissioner workflow.
