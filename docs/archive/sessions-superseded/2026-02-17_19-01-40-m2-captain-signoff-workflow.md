# Session Overview: Captain Submit + Opponent Sign-Off Workflow

- Date: Tuesday, 17 February 2026
- Scope: Implemented Milestone 2 fixture state transitions and sign-off flow.
- Commit: `0e6e682`

## API Changes
- Added `POST /api/v1/orgs/:orgId/fixtures/:fixtureId/submit`
- Added `POST /api/v1/orgs/:orgId/fixtures/:fixtureId/approve`
- Added `POST /api/v1/orgs/:orgId/fixtures/:fixtureId/reject`

## State Transitions
- `SCHEDULED/IN_PROGRESS -> AWAITING_OPPONENT` on submit
- `AWAITING_OPPONENT -> LOCKED` on approve
- `AWAITING_OPPONENT -> DISPUTED` on reject

## Verification
- `npm --workspace apps/api run test:e2e` passed.
