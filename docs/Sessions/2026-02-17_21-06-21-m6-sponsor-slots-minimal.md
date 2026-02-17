# Session Overview: Milestone 6 Sponsor Slots (minimal organiser-controlled)

## Scope
Implemented minimal sponsor slot CRUD + retrieval with org scoping and role-based management.

## Prisma
- Added `SponsorScopeType` enum: `ORG | LEAGUE | DIVISION`
- Added `SponsorSlot` model with scoped targeting and active-window fields
- Added inverse relation on `Organisation` -> `sponsorSlots`
- Added migration: `20260217210320_sponsor_slots`

## API
- New module: `sponsors`
- Endpoints:
  - `GET /api/v1/orgs/:orgId/sponsors`
  - `POST /api/v1/orgs/:orgId/sponsors`
  - `PATCH /api/v1/orgs/:orgId/sponsors/:sponsorId`
  - `DELETE /api/v1/orgs/:orgId/sponsors/:sponsorId`
- Management restricted to `ORG_ADMIN` / `COMMISSIONER`
- Listing supports scope filters and returns active slots only

## Tests
- Added `apps/api/test/sponsors.e2e-spec.ts`
- Coverage:
  - admin create
  - non-admin blocked for create/update/delete
  - scope filters + active-window filtering
  - org isolation

## Verification
- `npm --workspace apps/api run test:e2e`
- Result: all suites passed.

## Web
- No `apps/web/app/sponsors-admin` page existed, so no UI wiring was added.
