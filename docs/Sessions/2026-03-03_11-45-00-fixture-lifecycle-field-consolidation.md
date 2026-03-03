# Session Overview: Fixture Lifecycle Field Consolidation

## Date
2026-03-03

## Scope
- Implemented the fixture lifecycle consolidation delta.
- Removed the duplicate `Fixture.status` field and kept `Fixture.state` as the only lifecycle authority.
- Kept the change narrow to schema, fixture API surface, dependent workflow services, and minimal web/admin wiring.

## Changes
- Added:
  - `docs/deltas/2026-03-03-fixture-lifecycle-field-consolidation.md`
  - `apps/api/prisma/migrations/20260303110000_fixture_lifecycle_state_only/migration.sql`
- Updated:
  - `apps/api/prisma/schema.prisma`
  - `apps/api/src/modules/fixtures/*`
  - `apps/api/src/modules/match-events/match-events.service.ts`
  - `apps/api/src/modules/disputes/disputes.service.ts`
  - `apps/api/scripts/seed-demo.ts`
  - `apps/api/test/fixtures.e2e-spec.ts`
  - `apps/api/test/match-events.e2e-spec.ts`
  - `apps/api/test/calendar.e2e-spec.ts`
  - `apps/api/test/notifications.e2e-spec.ts`
  - `apps/api/test/tv-overlay.e2e-spec.ts`
  - `apps/web/app/schedule/page.tsx`
  - `apps/web/app/match-night/page.tsx`
  - `docs/05-API-Spec-v1.md`
  - `docs/23-Minimal-Help-and-Runbook.md`

## Runtime behavior
- `Fixture.state` is now the single fixture lifecycle field in the schema and API responses.
- `GET /api/v1/orgs/:orgId/divisions/:divisionId/fixtures` supports `state` filtering instead of `status`.
- `PATCH /api/v1/orgs/:orgId/fixtures/:fixtureId` may update:
  - `scheduledAt`
  - `state` only when the requested value is `SCHEDULED` or `IN_PROGRESS`
- Governed lifecycle transitions such as opponent review, dispute, and lock remain restricted to match result and dispute workflows.

## Verification
- `npm --workspace apps/api run prisma:generate` passed
- `npm --workspace apps/api run typecheck` passed
- `npm --workspace apps/api run test:e2e` passed (`21/21` suites, `28/28` tests)
- `npm --workspace apps/web run typecheck` passed
- `npm --workspace apps/web run build` passed

## Notes
- This slice intentionally did not remove the legacy admin `complete` endpoint.
- The next step should again start with an explicit delta selection rather than ad hoc feature work.
