# Session Overview: Venue Authority and Capacity Baseline

## Date
2026-03-03

## Scope
- Implemented a narrow league-operations baseline slice for venue authority.
- Added first-class venues, optional team venue assignment, and fixture-generation capacity warnings.
- Kept the slice intentionally short of a full venue-aware scheduler.

## Changes
- Added:
  - `docs/deltas/2026-03-03-venue-authority-and-capacity-baseline.md`
  - `apps/api/src/modules/venues/*`
  - Prisma migration for `Venue` and `Team.venueId`
- Updated:
  - `apps/api/prisma/schema.prisma`
  - `apps/api/src/modules/teams-players/*`
  - `apps/api/src/modules/fixtures/*`
  - `apps/api/test/teams-players.e2e-spec.ts`
  - `apps/api/test/fixtures.e2e-spec.ts`
  - `docs/05-API-Spec-v1.md`
  - `docs/04-Data-Model-and-Constraints.md`

## Runtime behavior
- Organisations can now create, list, and update venues.
- Teams can now be assigned to an org-scoped venue.
- Team list responses include venue details when present.
- Fixture generation now returns venue-capacity warnings when assigned teams exceed venue capacity for the league sport.

## Verification
- `npm --workspace apps/api run prisma:generate` passed
- `npm --workspace apps/api exec prisma migrate deploy` passed
- `npm --workspace apps/api run typecheck` passed
- `npm --workspace apps/api run test:e2e -- teams-players.e2e-spec.ts` passed
- `npm --workspace apps/api run test:e2e -- fixtures.e2e-spec.ts` passed

## Notes
- This slice intentionally does not implement venue-admin roles or venue-aware round scheduling.
- Capacity output is warning-oriented so organisers can spot venue pressure before deeper scheduler work exists.
