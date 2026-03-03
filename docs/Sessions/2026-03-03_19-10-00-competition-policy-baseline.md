# Session Overview: Competition Policy Baseline

## Date
2026-03-03

## Scope
- Implemented a narrow organiser-policy baseline slice at season level.
- Added season competition policy fields and organiser read/update endpoints.
- Enforced `minimumPlayersPerMatch` before result submission and legacy complete.

## Changes
- Added:
  - `docs/deltas/2026-03-03-competition-policy-baseline.md`
  - Prisma migration for season competition policy fields
  - season update DTO for policy changes
- Updated:
  - `apps/api/prisma/schema.prisma`
  - `apps/api/src/modules/seasons/*`
  - `apps/api/src/modules/match-events/match-events.service.ts`
  - `apps/api/test/seasons-divisions.e2e-spec.ts`
  - `apps/api/test/match-events.e2e-spec.ts`
  - `docs/05-API-Spec-v1.md`
  - `docs/04-Data-Model-and-Constraints.md`

## Runtime behavior
- Season responses now expose a structured `competitionPolicy`.
- Organisers can patch season policy through the season API surface.
- Current live enforcement checks `minimumPlayersPerMatch` against season roster counts before result submit and legacy complete.
- Other policy fields are stored and surfaced now, with broader enforcement deferred.

## Verification
- `npm --workspace apps/api run prisma:generate` passed
- `npm --workspace apps/api exec prisma migrate deploy` passed
- `npm --workspace apps/api run typecheck` passed
- `npm --workspace apps/api run test:e2e -- seasons-divisions.e2e-spec.ts` passed
- `npm --workspace apps/api run test:e2e -- match-events.e2e-spec.ts` passed

## Notes
- This slice intentionally uses roster counts as the legal-match baseline, not attendance tracking.
- Match-order hiding and same-night opponent restrictions are documented baseline policy only for now.
