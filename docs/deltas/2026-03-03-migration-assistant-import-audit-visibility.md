# Delta: Migration Assistant Import Audit Visibility
Date: 2026-03-03

Implementation status:
- Implemented and validated on 2026-03-03.

## What changes
Expose prior import audit summaries clearly in the migration assistant review surface so organisers can confirm what actually imported after the fact.

This scope stays tight:
- use existing `importAudits` already returned on migration job detail
- render a readable audit summary in `/migration-assistant`
- keep audit data informational only
- do not add new filters, export paths, or audit mutation behavior

## Why
Validation and preview now help before import, but organisers still need a direct answer to "what was actually imported?" after a job completes:
- imported counts should be visible without reading raw JSON
- audit visibility supports admin traceability
- this is the smallest follow-on that improves post-import confidence without widening migration scope

## Impacted modules/files
- `apps/web/app/migration-assistant/*`
- `apps/web/smoke/migration-assistant.smoke.spec.tsx`
- `apps/api/test/migration-jobs.e2e-spec.ts`
- `docs/29-M9-Legacy-Migration-Assistant-Contract.md`
- `docs/05-API-Spec-v1.md`
- session note and status docs

## DB changes required
- No schema changes.
- No migrations.

## Test additions required
- API e2e:
  - imported job response includes readable import audit summary counts
- Web:
  - migration assistant review UI renders empty and populated import audit state

## Acceptance criteria
- migration job detail remains the source for prior import audit records
- migration assistant UI surfaces import audit history without exposing raw summary JSON only
- imported audit entries show at least actor, timestamp, and imported counts
- `npm --workspace apps/api run test:e2e -- migration-jobs.e2e-spec.ts` passes
- `npm --workspace apps/web run test:smoke` passes
- `npm --workspace apps/web run build` passes

## Cost
- No milestone sequencing shift.
- Small M9-adjacent admin-audit visibility delta only.
- Improves post-import traceability without changing import semantics.
