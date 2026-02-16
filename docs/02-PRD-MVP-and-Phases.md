# 02 PRD — MVP and Phases
Generated: 2026-02-12

## MVP Functional Requirements

### A) Multi-tenancy and identity
- Organisation (tenant) boundary across all domain objects.
- Users authenticate via email/password initially.
- Users can belong to multiple organisations (later), but MVP may restrict to one org membership to simplify.

### B) Roles and permissions
Roles (MVP):
- OrgAdmin: full control
- Commissioner: league/season control + disputes
- Captain: team roster + match capture + token transfer
- Player: view-only + friendlies for personal stats

Permission model:
- RBAC at API layer.
- Row-level filtering by organisation_id.

### C) League structure
- League: sport, ruleset, default match template
- Season: start/end, weekly match night default (optional)
- Division: grouping of teams inside a season
- Team: name, home venue (optional MVP)
- Player: name, phone (for SMS), email

### D) Fixtures and scheduling
- Generate round-robin fixtures for division.
- Allow manual edits: reschedule, swap home/away, set venue, postpone.
- Publish schedule to:
  - public read-only share link (optional MVP)
  - .ics calendar export for captains/players
- Fixture status: scheduled → in_progress → completed.

### E) Match capture and governance
Match control tokens:
- One per team per fixture.
- Captain can transfer token; recipient must accept.
- Only current token holder can submit events for their team, unless captain override (configurable; default yes).

Match capture:
- English 8-ball: enter frame wins; optionally per-frame player assignments (Phase 2).
- Minimal data to compute result: per-frame winner.
- Lock match on completion, with a configurable edit window.

Audit:
- Every change is an event in match_event_log with revision sequencing.

### F) Standings and stats
Standings:
- Derived from match events and configured points model.
- Stored as snapshots per division for fast read.

Stats (MVP):
- Player: matches played, wins/losses; frames won/lost (pool), legs won/lost (darts later).
- Team: matches played, wins/losses.

Friendlies:
- Allowed for personal stats only.
- Verified if both sides accept; otherwise marked unverified.
- Do not affect standings.

### G) Disputes
- Any captain or commissioner can open a dispute against a fixture.
- Dispute has a status: open → under_review → resolved → rejected.
- Evidence attachments: optional URLs / uploads (Phase 2 for file upload).

### H) Messaging and calendar (MVP requirement)
- Send reminders: 24h before fixture (configurable per league).
- Send immediate notifications on fixture changes.
- Channels:
  - SMS (provider abstraction)
  - WhatsApp (via provider abstraction)
  - Email (optional minimal)
- Calendar:
  - Generate per-player .ics feed link and/or per-fixture invite files.
  - Ensure fixture updates reflect in feed (best-effort via updated feed, not push re-invites).

## Non-functional Requirements
- Observability: message send logs, delivery status, retries, and failure alerts.
- Security: strict org isolation; no cross-tenant reads.
- Data correctness: standings reproducible from event log.
- Performance: handle 10k+ players and 100+ leagues (within one deployment).

## Phase plan
Phase 1 (MVP Pool League):
- Everything above for English 8-ball.

Phase 2 (Governance hardening):
- Offline-first event queue
- Stronger disputes + evidence uploads
- Better match templates and roster enforcement
- Admin diagnostics (“replay standings” tooling)

Phase 3 (Commercial + Darts):
- Subscription billing
- Add PDC 501
- Optional payments module (entry fees) as add-on
- TV/venue mode

Phase 4 (Scale/Enterprise):
- Federation exports + API access tiers
- White-label options
