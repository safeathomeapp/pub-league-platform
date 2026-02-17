# Session Note: Web Match Night - Submit/Approve/Reject UX

## Date
2026-02-17 23:12:24

## Scope
- Updated `apps/web/app/match-night/page.tsx` to support captain submission and opponent sign-off workflow.
- No backend/API changes.

## UX Behaviour Added
- Fixture state visibility (`SCHEDULED`, `IN_PROGRESS`, `AWAITING_OPPONENT`, `DISPUTED`, `LOCKED`) with a required-action label.
- Result submission flow:
  - Uses accepted token holder identity from fixture tokens.
  - Captures final `homeFrames` / `awayFrames`.
  - Calls `POST /api/v1/orgs/:orgId/fixtures/:fixtureId/submit`.
- Opponent sign-off flow:
  - Approve path calls `POST /api/v1/orgs/:orgId/fixtures/:fixtureId/approve`.
  - Reject path calls `POST /api/v1/orgs/:orgId/fixtures/:fixtureId/reject` with optional reason.
- Basic dispute visibility:
  - When fixture is `DISPUTED`, loads and shows disputes via `GET /api/v1/orgs/:orgId/fixtures/:fixtureId/disputes`.

## Data/Permission Mapping in UI
- Loads fixtures and teams for the selected division.
- Loads token lists for fixtures and events for the selected fixture.
- Determines acting token holder from accepted, non-revoked tokens.
- `canSubmit` if fixture state is `SCHEDULED`/`IN_PROGRESS` and selected acting holder has accepted token.
- `canApprove`/`canReject` if fixture state is `AWAITING_OPPONENT` and acting holder team differs from submitting team from latest `RESULT_SUBMITTED` event payload.

## Endpoint Payload Shapes Used
- Submit:
  - `{ expectedRevision, homeFrames, awayFrames, teamId, actorPlayerId }`
- Approve:
  - `{ expectedRevision, teamId, actorPlayerId }`
- Reject:
  - `{ expectedRevision, teamId, actorPlayerId, reason? }`

## Verification
- `npm --workspace apps/web run typecheck` passed.
- `npm --workspace apps/web run build` passed.

## Notes
- Due current API contract, UI actor identity is represented by selected accepted token-holder `actorPlayerId`.
