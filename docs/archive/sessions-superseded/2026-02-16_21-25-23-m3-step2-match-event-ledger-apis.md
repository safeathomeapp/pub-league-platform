# Session Overview: Milestone 3 Step 2 - Match Event Ledger APIs

- Date: Monday, 16 February 2026
- Time: 21:25:23 +00:00
- Session Timestamp: 2026-02-16_21-25-23

## Scope
Implemented match ledger endpoints from `docs/05-API-Spec-v1.md` with optimistic revision checks and permission enforcement:

- `POST /api/v1/orgs/:orgId/fixtures/:fixtureId/events`
- `GET /api/v1/orgs/:orgId/fixtures/:fixtureId/events`
- `POST /api/v1/orgs/:orgId/fixtures/:fixtureId/complete`

## Files Added
- `apps/api/src/modules/match-events/match-events.module.ts`
- `apps/api/src/modules/match-events/match-events.controller.ts`
- `apps/api/src/modules/match-events/match-events.service.ts`
- `apps/api/src/modules/match-events/dto/create-match-event.dto.ts`
- `apps/api/src/modules/match-events/dto/complete-match.dto.ts`
- `apps/api/test/match-events.e2e-spec.ts`

## Files Updated
- `apps/api/src/modules/app/app.module.ts`

## Implementation Notes
- Added strict org-scoped fixture lookup before all event operations.
- Implemented revision-safe append behavior:
  - reads latest revision for fixture
  - requires `expectedRevision` to match latest
  - appends next sequential revision
  - returns `409` on mismatch
- `complete` endpoint writes a `MATCH_COMPLETED` ledger event and marks fixture status as `completed`.
- Permission model in service:
  - direct override: `ORG_ADMIN`, `COMMISSIONER`, `CAPTAIN`
  - player-role writes require accepted active token identity (`teamId + actorPlayerId`) for fixture/team
- Included inline note clarifying temporary token-holder identity approach until user-player linking exists.

## Test Coverage
Added e2e test that validates:
- successful event append at expected revision
- revision conflict returns `409`
- event listing order and revision values
- `complete` endpoint appends event and updates fixture status
- cross-tenant read denied (`403`)
- player-role write without accepted token denied (`403`)

File:
- `apps/api/test/match-events.e2e-spec.ts`

## Verification
Command run:
- `npm --workspace apps/api run test:e2e`

Result:
- 12 suites passed
- 12 tests passed

## Outcome
Milestone 3 now has token governance + append-only match event ledger operations with optimistic concurrency and tested access controls.
