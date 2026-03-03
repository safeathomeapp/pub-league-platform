# Delta: Fixture Lifecycle Field Consolidation
Date: 2026-03-03

Implementation status:
- Proposed on 2026-03-03.
- Not yet implemented.

## What changes
Consolidate fixture lifecycle handling so governed match flow has a single canonical field. The implementation will treat `Fixture.state` as the authority for lifecycle semantics and remove operational dependence on the duplicate `Fixture.status` field where it currently introduces drift risk.

This delta is intentionally narrow:
- keep scheduling semantics intact
- preserve the submit/approve/reject/dispute/lock workflow
- remove duplicate lifecycle write paths that can desynchronize fixture meaning
- update API/web/docs to expose one clear lifecycle model

This is a governance-hardening and model-clarity delta, not a new product feature.

## Why
Current roadmap-defined work is complete through Milestone 9, but the code audit still records residual model debt around fixture lifecycle duplication:
- `Fixture.state` encodes governed states such as `AWAITING_OPPONENT`, `DISPUTED`, and `LOCKED`
- `Fixture.status` still exists with overlapping but weaker values (`scheduled`, `in_progress`, `completed`)
- previous hardening only mitigated drift by blocking some patch paths and synchronizing selected updates

That mitigation reduced risk but did not remove it. Keeping both fields extends ambiguity in the schema, DTOs, UI, and tests. This weakens the project’s governance-first principle because match authority rules should be represented by one explicit state machine.

## Canonical model decision
- Canonical lifecycle field: `Fixture.state`
- Canonical lifecycle enum: `FixtureState`
- Scheduling remains represented by `scheduledAt`
- Generic fixture patch flows may update scheduling details only; they must not define alternative lifecycle authority outside the governed match workflow

## Impacted modules/files
- `apps/api/prisma/schema.prisma`
- Prisma migration for fixture lifecycle consolidation
- `apps/api/src/modules/fixtures/*`
- `apps/api/src/modules/match-events/*`
- `apps/api/src/modules/disputes/*`
- `apps/api/src/modules/tv/*`
- `apps/api/src/modules/standings/*`
- `apps/api/test/*.e2e-spec.ts` for fixture and match flow coverage
- `apps/web/app/schedule/page.tsx`
- `apps/web/app/match-night/page.tsx`
- `docs/05-API-Spec-v1.md`
- `docs/23-Minimal-Help-and-Runbook.md`
- session note for implementation and validation

## DB changes required
- Remove `Fixture.status` after migrating any remaining reads/writes to `Fixture.state`
- Replace any fixture indexes that currently depend on `status` with `state` where lifecycle filtering still matters
- Keep existing fixture records valid by mapping:
  - `scheduled` -> `SCHEDULED`
  - `in_progress` -> `IN_PROGRESS`
  - `completed` -> `LOCKED` only where legacy rows require reconciliation and current `state` is not already authoritative

Migration rule:
- when both fields exist, preserve `state` as the source of truth
- do not overwrite governed states such as `AWAITING_OPPONENT`, `DISPUTED`, or `LOCKED` from legacy `status`

## Test additions required
- API e2e:
  - generic fixture patch cannot bypass governed lifecycle transitions
  - fixture reads expose the canonical lifecycle field consistently
  - submit/approve/reject/dispute flows still produce correct `FixtureState`
- Web:
  - schedule page edits scheduling details without depending on a second lifecycle field
  - match-night flow still renders actions correctly from `state`

## Acceptance criteria
- `Fixture.state` is the only lifecycle authority in schema and API contracts
- no fixture can hold conflicting lifecycle values because duplicate lifecycle storage is removed
- generic fixture update paths cannot mark a fixture completed or otherwise bypass governed transitions
- standings, TV overlay, disputes, and match-night behavior continue to derive from the canonical lifecycle model
- docs and runbook references use one fixture lifecycle vocabulary only

## Cost
- No roadmap milestone sequencing shift.
- Small post-M9 hardening delta only.
- Reduces residual model ambiguity before any future product-scope expansion.
