# 25 Implementation Plan Pivot
Generated: 2026-02-17

Scope: implementation plan only for pivot direction. No feature code in this document.

## Milestone 1 Baseline Hardening + Schema Integrity
Goal: make current model safe for pivot rules before behavior changes.

### DB changes
- Add missing FKs:
  - `MatchControlToken.teamId -> Team.id`
  - `MatchControlToken.currentHolderPlayerId -> Player.id`
  - `StandingsSnapshot.divisionId -> Division.id`
  - optional policy decision for `MatchEvent.actorUserId -> User.id` (nullable FK or retain denormalized string).
- Add enum-backed states:
  - dispute status enum
  - match event type enum (or constrained string table).
- Add constraints/indexes:
  - prevent `homeTeamId == awayTeamId` on fixture.
  - indexes for fixture status and event lookup by fixture/time.

### Endpoints
- No new feature endpoints; keep compatibility.
- Optional internal health endpoint for migration readiness report.

### Tests
- Migration integrity tests.
- E2E regression rerun for all existing routes.

### Minimal UI
- None beyond existing pages.

### File-by-file plan
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/*`
- `apps/api/test/*.e2e-spec.ts` (update for enum/validation changes only)
- `docs/26-Code-Audit-Inventory.md` (update if schema changes)

### Acceptance criteria
- All existing e2e tests pass.
- New constraints prevent invalid token/team/player links.
- No cross-tenant regression.

## Milestone 2 Match Submission + Opponent Sign-off State Machine
Goal: replace direct completion authority with bilateral sign-off workflow.

### DB changes
- Add fixture result workflow fields (or dedicated table):
  - `submissionState`
  - `submittedByUserId`
  - `submittedAt`
  - `signoffByUserId`
  - `signoffAt`
- Add event types for submit/accept/reject/lock transitions.

### Endpoints
- New:
  - `POST /orgs/:orgId/fixtures/:fixtureId/submit`
  - `POST /orgs/:orgId/fixtures/:fixtureId/signoff`
  - `POST /orgs/:orgId/fixtures/:fixtureId/reject`
- Existing `/complete` becomes compatibility shim or deprecated path.

### Tests
- New e2e:
  - submit by captain
  - opponent sign-off
  - reject -> dispute path
  - unauthorized actor attempts

### Minimal UI
- Update `/match-night` flow:
  - submit payload
  - opponent accept/reject actions
  - visible state transitions

### File-by-file plan
- `apps/api/src/modules/match-events/match-events.controller.ts`
- `apps/api/src/modules/match-events/match-events.service.ts`
- `apps/api/src/modules/match-events/dto/*`
- `apps/api/src/modules/fixtures/fixtures.service.ts` (state exposure)
- `apps/api/test/match-events.e2e-spec.ts`
- `apps/web/app/match-night/page.tsx`

### Acceptance criteria
- Locked result requires opponent sign-off or dispute resolution.
- Event log records each transition with actor and revision.
- Old paths either mapped safely or rejected with clear error.

## Milestone 3 Dispute-First Resolution Integration
Goal: formalize reject/escalate path and commissioner resolution semantics.

### DB changes
- Add structured dispute linkage to submission events.
- Optional resolution metadata fields (decision reason, adjusted score payload).

### Endpoints
- Extend disputes:
  - open from sign-off rejection context
  - resolve with explicit outcome payload that can lock fixture.

### Tests
- E2E:
  - reject submission -> dispute auto/open behavior
  - commissioner resolution locks fixture and triggers standings recompute.

### Minimal UI
- `/disputes` page: add fixture submission context and resolution result preview.

### File-by-file plan
- `apps/api/src/modules/disputes/disputes.service.ts`
- `apps/api/src/modules/disputes/disputes.controller.ts`
- `apps/api/src/modules/disputes/dto/*`
- `apps/api/src/modules/standings/standings.service.ts`
- `apps/api/test/disputes.e2e-spec.ts`
- `apps/web/app/disputes/page.tsx`

### Acceptance criteria
- Rejected submissions always traceable to dispute records.
- Resolution creates deterministic lock outcome.

## Milestone 4 Standings + Head-to-Head Stats
Goal: standings/stat reads based on locked outcomes only and add head-to-head API.

### DB changes
- Optional materialized snapshot extension for stats cache.
- Indexes for head-to-head query performance.

### Endpoints
- Update standings derivation criteria.
- New:
  - `GET /orgs/:orgId/stats/head-to-head?teamAId=&teamBId=`

### Tests
- E2E:
  - standings ignores unapproved submissions
  - head-to-head values match locked ledger history
  - org isolation for stats endpoints

### Minimal UI
- Extend `/standings` with optional head-to-head lookup panel.

### File-by-file plan
- `apps/api/src/modules/standings/standings.service.ts`
- `apps/api/src/modules/standings/standings.controller.ts`
- `apps/api/src/modules/stats/*` (new module)
- `apps/api/src/modules/app/app.module.ts` (register module)
- `apps/api/test/standings.e2e-spec.ts`
- `apps/api/test/stats-head-to-head.e2e-spec.ts` (new)
- `apps/web/app/standings/page.tsx`

### Acceptance criteria
- Standings tables derive only from locked result state.
- Head-to-head endpoint is deterministic and org-scoped.

## Milestone 5 Sponsorship Slots (Minimal)
Goal: allow organiser-controlled sponsor slots for key views/endpoints.

### DB changes
- Add `SponsorSlot` model with scope and active window fields.
- Add indexes on (`organisationId`, `scopeType`, `scopeId`, `activeFrom`, `activeTo`).

### Endpoints
- CRUD:
  - `POST/GET/PATCH/DELETE /orgs/:orgId/sponsors/...`
- Read:
  - active slots by scope for UI consumption.

### Tests
- E2E for CRUD + org isolation + active-window filtering.

### Minimal UI
- New admin page `/sponsors` for slot management.
- Read-only slot display on schedule/standings pages.

### File-by-file plan
- `apps/api/prisma/schema.prisma`
- `apps/api/src/modules/sponsors/*` (new)
- `apps/api/src/modules/app/app.module.ts`
- `apps/api/test/sponsors.e2e-spec.ts` (new)
- `apps/web/app/sponsors/page.tsx` (new)
- `apps/web/app/schedule/page.tsx`
- `apps/web/app/standings/page.tsx`

### Acceptance criteria
- Admin can manage sponsor slots by scope.
- Active slots are returned and rendered predictably.

## Milestone 6 Transfer Rules + Season Roster Constraints
Goal: enforce player-team season constraints and transfer policy.

### DB changes
- Add season-aware roster membership model or extend existing team-player association:
  - unique constraint preventing same player in multiple teams in one season.
- Add transfer history model with effective dates.

### Endpoints
- Transfer endpoints:
  - request transfer
  - approve/apply transfer
  - list transfer history
- Roster write endpoints enforce season uniqueness.

### Tests
- E2E:
  - reject dual-team same-season membership
  - transfer effective date behavior
  - historical fixture attribution preserved

### Minimal UI
- Add transfer controls in team/roster admin flow.

### File-by-file plan
- `apps/api/prisma/schema.prisma`
- `apps/api/src/modules/teams-players/teams-players.service.ts`
- `apps/api/src/modules/teams-players/teams-players.controller.ts`
- `apps/api/src/modules/teams-players/dto/*`
- `apps/api/test/teams-players.e2e-spec.ts`
- `apps/web/app/orgs/page.tsx` or dedicated roster page

### Acceptance criteria
- Player cannot be rostered in two teams in same season.
- Transfer workflow is auditable and deterministic.

## Sequencing rationale
- Integrity first (Milestone 1) prevents invalid data during pivot.
- State machine (Milestones 2-3) before derived outputs (Milestone 4).
- Sponsorship and transfer constraints follow once core governance path is stable.

