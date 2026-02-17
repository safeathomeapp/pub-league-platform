# Pub League Platform — Program & Schedule (Set-in-Stone Roadmap v1)
Date: 2026-02-17  
Timezone: Europe/London

This document is the authoritative roadmap for the pivot. It defines the sequence of work, what “done” means, and a strict change-control process so the project stays tight.

---

## Blunt answer: plan everything now vs iterate?
Plan the **foundation once**, but keep the **product scope as a controlled living document**.

If you try to list *all* future functionality now and design the whole system to handle it, you will overbuild, delay shipping, and still get things wrong because real user behavior will change requirements.

What keeps the project tighter is:
1) **Freeze architecture invariants** (the foundation) and do not casually change them.  
2) **Iterate features with change control** (every scope change becomes an explicit “delta” with cost).

So: define the *invariants now*, then build in milestones with small controlled edits, not “rewrite as we go”.

---

## 1) Non‑negotiable architectural invariants (do not change without ADR)
These are the “foundation once” items.

1. Multi‑tenant isolation by `organisationId` on every org-scoped query. No cross-tenant reads.  
2. Immutable match history model: outcomes and stats are derived from append-only events (compensating events allowed).  
3. Governance-first workflow: match results become “official” only through defined state transitions (captain sign-off and/or dispute resolution).  
4. Role & token authority rules: only authorised holders can submit/approve.  
5. All time stored UTC; displayed Europe/London; calendar feeds (.ics) supported.  
6. Outbox pattern for notifications (no inline SMS/WhatsApp send inside request handlers).  
7. Statuses and event types are **enums**, not free-form strings.

All changes to these require an ADR in `/docs/20-ADRs.md`.

---

## 2) Product invariants (commercial + UX)
1. Admin-first: organiser can run the league with minimal manual data entry.  
2. Captains do day-to-day operations: submit results, approve, manage rosters.  
3. Disputes are captain-first; organiser only handles escalations.  
4. Head-to-head stats are a core retention feature.  
5. Sponsorship slots are league-controlled and configurable (requested by organisers).

---

## 3) Release strategy
We ship in “thin slices” that are:
- schema-safe
- test-covered
- deployable
- reversible

We do not ship partially defined workflows.

---

## 4) Definition of Done (global)
A milestone is “done” only if:
- API endpoints are implemented AND have E2E tests
- tenant scoping is enforced via guards + service filters
- DB constraints exist for integrity rules (where feasible)
- docs updated (spec + roadmap + ADRs where required)
- web UI provides minimal operational flow for the milestone
- no tracked build artifacts (.next, dist) committed

---

## 5) Program schedule (Milestones)
Time estimates are intentionally omitted; success criteria matter more than guesses.

### Milestone 0 — Repo hygiene + baseline freeze (1 commit)
Goal: eliminate noise and lock baseline.
Deliverables:
- `.gitignore` updated to exclude `apps/web/.next/**`, logs, dist, env files.
- Commit + annotated tag: `baseline-mvp`.
Acceptance:
- `git status` clean after `npm install` + running web dev server.

### Milestone 1 — Schema integrity + constraint hardening (must be first)
Goal: remove integrity holes that will corrupt governance.
Deliverables (Prisma + migration):
- Add missing FKs:
  - `MatchControlToken.teamId -> Team.id`
  - `MatchControlToken.currentHolderPlayerId -> Player.id`
  - `StandingsSnapshot.divisionId -> Division.id`
  - `MatchEvent.actorUserId -> User.id`
- Convert free-form fields to enums:
  - `Dispute.status` enum
  - `MatchEvent.eventType` enum (and any fixture status strings)
- Add constraints:
  - prevent `homeTeamId == awayTeamId`
  - enforce “player cannot be in 2 teams in same season” (via unique indexes / join model)
  - enforce token holder belongs to the team roster (where enforceable)
Acceptance:
- `npm --workspace apps/api run db:push` succeeds
- All E2E tests pass

### Milestone 2 — Match submission + opponent sign‑off workflow (the pivot core)
Goal: captains run match night; organiser only sees escalations.
Design:
- Introduce `FixtureState` enum (example):
  - `SCHEDULED`, `IN_PROGRESS`, `SUBMITTED`, `AWAITING_OPPONENT`, `LOCKED`, `DISPUTED`, `RESOLVED`
- Define legal transitions (enforced in service layer; optionally DB constraints).
Deliverables:
- Endpoints:
  - submit result (by authorised token holder)
  - approve result (opponent token holder)
  - reject result (creates dispute or returns to editing state)
  - escalate to dispute
- Audit trail: events appended for each transition.
Acceptance:
- E2E tests cover:
  - happy path: submit -> approve -> locked
  - reject path: submit -> reject -> disputed
  - permission errors: non-holder cannot submit/approve
  - cannot approve after lock, cannot lock without both approvals (if required)

### Milestone 3 — Dispute resolution semantics (organiser intervention)
Goal: disputes are structured and resolvable without data corruption.
Deliverables:
- Dispute statuses + resolution actions (enum-driven)
- Resolution produces:
  - compensating event(s) OR explicit “finalised outcome” event
  - fixture transitions to `RESOLVED` then `LOCKED`
- Notification outbox entries created for dispute events
Acceptance:
- E2E tests cover dispute create -> resolve -> standings impact

### Milestone 4 — Standings from locked outcomes only
Goal: tables reflect agreed outcomes only.
Deliverables:
- Standings service reads only fixtures in `LOCKED` (and/or `RESOLVED->LOCKED`) state
- Backfill/recalc strategy documented
Acceptance:
- A submitted-but-not-locked match does not alter standings
- Locked match does

### Milestone 5 — Head‑to‑head stats (derive first, optimise later)
Goal: sticky player engagement.
Deliverables:
- Stats module endpoint:
  - `/orgs/:orgId/stats/head-to-head?playerA=...&playerB=...`
- Response includes matches played, wins/losses, frames/legs won, last N matches.
- Derived from events for locked fixtures only.
Acceptance:
- E2E test creates two players, logs events, locks fixture, retrieves correct stats.

### Milestone 6 — Sponsorship slots (minimal, organiser-controlled)
Goal: enable league monetisation and retention value.
Deliverables:
- SponsorSlot model (org-scoped + scope type + dates + ordering)
- Admin endpoints to CRUD sponsor slots
- Web UI to manage sponsor slots (minimal)
Acceptance:
- Sponsor slot can be created and retrieved in relevant views
- No ads unless organiser configured them

### Milestone 7 — Transfers + season roster enforcement (if not already complete)
Goal: stop “ringers” and keep records credible.
Deliverables:
- Transfer workflow (effective date, approvals, audit trail)
- Constraints to prevent invalid overlaps
Acceptance:
- A player cannot appear for two teams in the same season after transfers.

### Milestone 8 (Phase 2) — TV Mode overlay + pub display
Goal: “match night operating system” and sponsor surface.
Deliverables:
- Read-only overlay page that subscribes to live state
- Sponsor rotation placements
Acceptance:
- Live updates reflect in overlay without manual refresh.

### Milestone 9 (Phase 2) — Legacy migration assistant (screenshot uploads)
Goal: reduce switching friction.
Deliverables:
- Upload pipeline + job model + review UI
- No automatic import without explicit confirmation.
Acceptance:
- A migration job can be created, reviewed, and then imported with audit.

---

## 6) Change control (keeps the project tight)
Any scope change must be recorded as a **Delta**.

Process:
1. Create a short doc: `/docs/deltas/YYYY-MM-DD-<slug>.md`
2. Include:
   - What changes (one paragraph)
   - Why (user pain / commercial)
   - Impacted modules/files
   - DB changes required
   - Test additions required
   - “Cost” in terms of milestones shifted
3. Only after the Delta is written do we implement.

Rule: “No delta, no scope change.”

---

## 7) Codex operating instruction (how to work this roadmap)
Codex must:
- implement only the current milestone
- add/modify E2E tests for every new endpoint
- not introduce new models/enums without referencing the milestone doc
- keep commits small and reversible
- never commit build artifacts (.next, dist)

---

## 8) Immediate next actions (today)
1. Clean `.next` churn and update `.gitignore` (Milestone 0).  
2. Implement missing FKs + enums + constraints (Milestone 1).  
3. Only then begin the sign-off workflow (Milestone 2).  
