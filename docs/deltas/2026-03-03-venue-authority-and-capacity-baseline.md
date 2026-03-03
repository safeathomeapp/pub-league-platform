# Delta: Venue Authority and Capacity Baseline
Date: 2026-03-03

Implementation status:
- Implemented and validated on 2026-03-03.

## What changes
Introduce a first-class venue baseline for league operations: venues are now org-scoped records, teams can be assigned to a venue, and round-robin fixture generation returns deterministic venue-capacity warnings when assigned teams exceed the venue's configured capacity for the league sport.

This scope stays tight:
- add venue CRUD and team-to-venue assignment
- keep venue capacity simple per sport (`poolTables`, `dartsBoards`)
- surface capacity warnings during fixture generation
- do not implement a full venue-aware scheduler or venue-admin role system yet

## Why
The current league model was team-centric but venue-blind:
- organisers need a first-class venue layer to model real match-night constraints
- teams need explicit home venue assignment
- fixture generation should at least surface capacity risk instead of assuming every venue can host any team count

## Impacted modules/files
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/*venue_authority_capacity_baseline*`
- `apps/api/src/modules/venues/*`
- `apps/api/src/modules/teams-players/*`
- `apps/api/src/modules/fixtures/*`
- `apps/api/test/teams-players.e2e-spec.ts`
- `apps/api/test/fixtures.e2e-spec.ts`
- `docs/05-API-Spec-v1.md`
- `docs/04-Data-Model-and-Constraints.md`
- session note and status docs

## DB changes required
- Add `Venue` model.
- Add nullable `Team.venueId`.
- Add foreign key from `Team.venueId` to `Venue.id`.

## Test additions required
- API e2e:
  - venue create/list/update
  - team create/update with venue assignment
  - fixture generation returns deterministic capacity warnings for overloaded venues

## Acceptance criteria
- organisers can create, list, and update venues per organisation
- teams can be assigned to a venue
- team list includes assigned venue information
- fixture generation returns venue-capacity warnings when assigned team count exceeds venue capacity for the league sport
- `npm --workspace apps/api run prisma:generate` passes
- `npm --workspace apps/api run typecheck` passes
- `npm --workspace apps/api run test:e2e -- teams-players.e2e-spec.ts` passes
- `npm --workspace apps/api run test:e2e -- fixtures.e2e-spec.ts` passes

## Cost
- No roadmap milestone shift.
- Narrow league-operations baseline delta only.
- Establishes venue truth without opening full scheduling or venue-admin scope.
