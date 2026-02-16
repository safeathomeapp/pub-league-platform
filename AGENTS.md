# AGENTS.md — Rules for Codex and Claude Code (Project Operating Manual)
Generated: 2026-02-12

This file is the operating manual for all AI assistants and humans working on this repo. Treat it as binding.

## 1) Project intent
Build an admin-first league management platform for UK English 8-ball first, then PDC 501 double-out. Formal leagues are the commercial core. Ad-hoc matches exist only for personal stats and must never affect league tables.

## 2) Non-negotiable principles
1. Single source of truth: match_event_log. Standings and stats are derived. No mutable totals.
2. Tenant isolation: every domain query is scoped by organisation_id. No cross-tenant reads, ever.
3. Governance first: match control tokens + auditability. If a feature compromises integrity, it is rejected.
4. Minimal ambiguity: prefer explicit enums, schemas, and acceptance criteria to “smart inference”.
5. Avoid feature creep: MVP scope is locked by `/docs/02-PRD-MVP-and-Phases.md` and `/docs/12-Backlog-MVP-User-Stories.md`.

## 3) Coding standards (hard rules)
- TypeScript only (web + api).
- No business logic in controllers.
- All request bodies validated (DTO + class-validator or zod, pick one and stay consistent per service).
- Every org-scoped service method signature starts with `orgId: string`.
- All IDs are UUIDs.
- Never log secrets or full phone numbers. Mask PII in logs.
- All time stored in UTC in DB; rendered in Europe/London in UI and .ics.
- Use the Outbox pattern for messaging. Never send SMS/WhatsApp inline in a request handler.

## 4) API conventions
- Base prefix: /api/v1
- Auth: Bearer JWT (MVP)
- Error shape is standardised via a global exception filter.
- Status code correctness matters: 401 vs 403 vs 404 vs 409.

## 5) Data and correction policy
- Match events are append-only at the application level.
- Corrections are done by appending compensating events (e.g., MATCH_CORRECTED) and recomputing snapshots.
- Never delete match events to “fix” a table.

## 6) Messaging + calendar (MVP requirement)
- MVP must include:
  - .ics feeds
  - SMS and/or WhatsApp reminders
  - fixture change alerts
- Implement provider adapters and keep vendor-specific code behind an interface.
- Implement retries and surfaced failures (admin view). Silent failure is unacceptable.

## 7) Quality gates
No PR/commit is considered done unless:
- Typescript typecheck passes
- E2E tests for the touched area exist or are updated
- Docs updated if behavior changes
- A clear rollback path exists (migrations are reversible or safe)

## 8) Working style and “mannerisms” for AI assistants
- Be terse in code comments; be explicit in documentation.
- Prefer deterministic code over clever code.
- When uncertain, add TODO with a link to the relevant doc section (file + heading) and make the uncertainty explicit.
- Do not invent requirements. If not in docs, raise it as a proposed change in `/docs/20-ADRs.md` or a new doc.
- Keep changes small and reviewable. Do not refactor unrelated code.

## 9) Memory / context that must not be lost
- UK-only initially; rules engine must be extensible for other rulesets later.
- Pool first; darts after pool MVP is stable.
- Captain priority override exists; token transfer must be accepted by recipient.
- TV/venue mode is important but not MVP.
- Payments are Phase 3; do not implement in MVP.
- Admin-first product; player stats are secondary.

## 10) Task execution order
Follow `/docs/09-Implementation-Plan-and-Roadmap.md`.
Current focus: Milestone 1 (Auth + Organisations + Roles), then Milestone 2 (Fixtures + Calendar).

## 11) Definition of done (global)
- Feature works end-to-end locally via docker compose
- Test coverage exists for critical logic
- No cross-tenant access paths exist
- Observability for failures exists (at least logs + admin listing endpoints)
