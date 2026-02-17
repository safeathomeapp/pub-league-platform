# 24 Pivot Pack New Direction
Generated: 2026-02-17

Purpose: define delta from current MVP into delegated league operations, without losing core governance and tenant isolation.

## 1) What Stays (Non-negotiables)
- Multi-tenant isolation by `organisation_id` across all domain reads/writes.
- Append-only match event log as source of truth.
- Derived standings/stat snapshots (no mutable totals as source).
- Role-based authorization and org membership checks.
- Match governance and auditability (token controls + request IDs + error standardization).
- Outbox pattern for notifications (no inline vendor sends in request handlers).
- UTC storage for timestamps.

## 2) What Changes (Pivot)
- Primary product focus shifts to delegated league operations:
  - captains handle match submission and counter-signoff workflow.
  - commissioner/admin intervenes only on dispute/escalation paths.
- Match lifecycle adds explicit bilateral confirmation step before final lock.
- MVP UI/API emphasizes operational delegation and verification, not only admin CRUD.

## 3) Updated MVP Scope (Pivot MVP Only)
- Team operations baseline:
  - captain submits match result package.
  - opponent captain approves/rejects package.
  - approved results lock automatically; rejected path opens dispute.
- Governance:
  - explicit state machine for submission/sign-off/dispute.
  - immutable audit trail for transitions and actor identity.
- Scheduling + fixtures:
  - keep round-robin + manual reschedule + calendar feeds.
- Standings:
  - recompute from accepted/locked outcomes only.
- Core stats:
  - add head-to-head endpoint and deterministic derivation rules.
- Sponsorship (minimal):
  - organiser-managed sponsor slots tied to league/season context.

Out of pivot MVP (Phase 2+):
- TV overlay package.
- Recap content generator.
- Elo / power ranking systems.
- Data migration assistant and import mapping wizards.

## 4) Phase 2+ Backlog (Post-Pivot MVP)
- TV overlay mode (venue screens, fixtures/live/standings sponsor banners).
- Automated recap generator (match-week summaries).
- Elo and power rankings (opt-in, not standings authority).
- Migration assistant (legacy CSV/system import diagnostics + dry-run tools).
- Advanced evidence handling in disputes (uploads and review tooling).

## 5) Match Submission State Machine
Canonical fixture result state transitions (high-level):

1. `in_progress`
2. `submitted_by_home_captain` or `submitted_by_away_captain`
3. `awaiting_opponent_signoff`
4. Branch:
   - opponent accepts -> `locked`
   - opponent rejects -> `disputed`
5. From `disputed`:
   - commissioner resolves -> `locked` (with resolution event)
   - commissioner voids -> `in_progress` or `completed_reopen` (policy-controlled)

Required event log event types (minimum):
- `MATCH_SUBMITTED`
- `MATCH_SIGNOFF_ACCEPTED`
- `MATCH_SIGNOFF_REJECTED`
- `MATCH_LOCKED`
- `MATCH_DISPUTE_OPENED`
- `MATCH_DISPUTE_RESOLVED`

Lock rule:
- standings consume only `MATCH_LOCKED` effective outcomes.

## 6) Sponsorship Minimal Spec
### Data shape (minimal)
- Sponsor slot entity:
  - `organisationId`
  - `scopeType` (`league` | `season` | `division`)
  - `scopeId`
  - `slotKey` (e.g. `primary`, `secondary`, `footer`)
  - `name`
  - `logoUrl`
  - `linkUrl`
  - `activeFrom`, `activeTo`
  - `displayOrder`

### MVP behavior
- Org admin/commissioner can CRUD sponsor slots.
- Read endpoints expose active slots for schedule/standings/match views.
- No ad-rotation engine in MVP; deterministic ordered display only.

## 7) Stats Minimal Spec (Head-to-Head + Derived Rules)
### Endpoint
- `GET /api/v1/orgs/:orgId/stats/head-to-head`
- Query:
  - `teamAId`, `teamBId` (required)
  - optional date window (`from`, `to`)

### Response (minimum)
- matches played between teams
- wins/draws/losses per side
- frames (or legs) for/against
- last meeting summary
- trend over last N meetings (simple W/D/L sequence)

### Derivation rules
- Use locked match outcomes only.
- Never mutate stored totals directly; recompute from event ledger.
- Sport-aware metric naming:
  - pool: frames
  - darts: legs/sets (as configured)

## 8) Data Constraints (Pivot Requirements)
- Player cannot be rostered in two teams within the same season.
- Transfer rules:
  - transfer effective date required
  - historical fixtures preserve old team association
  - future fixtures use new roster membership from effective date.
- Captain/token holder rules:
  - captain can issue/transfer token.
  - recipient must explicitly accept before actions are authorized.
  - only current holder (or explicit override policy actor) can submit governed match events.

## 9) Compatibility Notes
- Existing APIs remain useful for transition, but fixture completion semantics will shift toward submit/sign-off/lock events.
- Existing standings service requires update to consume locked outcomes, not raw completion events.
- Existing tests remain baseline; pivot introduces a second-generation acceptance suite.

