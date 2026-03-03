# Delta: Migration Assistant Validation Summary
Date: 2026-03-03

Implementation status:
- Proposed on 2026-03-03.
- Not yet implemented.

## What changes
Add deterministic pre-import validation to the existing migration assistant so admins can see an explicit import-safety summary before confirming an import. The implementation will validate the reviewed draft structure, return a structured summary, display it in the review UI, and block invalid imports.

This scope is intentionally narrow:
- validate only the reviewed draft already stored on the migration job
- keep rules deterministic and schema-driven
- do not add OCR, fuzzy matching, or auto-repair logic
- improve admin review quality before import writes domain data

## Why
The migration assistant already supports upload, review, and explicit import with audit, but current review safety is still weaker than it should be:
- import risk is concentrated in draft correctness
- organisers need a clear, surfaced summary of blocking issues before import
- deterministic validation aligns with the project’s governance-first and minimal-ambiguity rules

This is the tightest product delta because it hardens an existing admin workflow rather than opening new feature scope.

## Impacted modules/files
- `apps/api/src/modules/migration-jobs/*`
- `apps/api/test/migration-jobs.e2e-spec.ts`
- `apps/web/app/migration-assistant/*`
- `apps/web/smoke/migration-assistant.smoke.spec.tsx`
- `docs/29-M9-Legacy-Migration-Assistant-Contract.md`
- `docs/05-API-Spec-v1.md`
- session note and status docs

## DB changes required
- No schema changes.
- No migrations.

## Test additions required
- API e2e:
  - review/read returns validation summary for invalid draft data
  - import rejects invalid draft data with clear error
  - valid reviewed draft still imports successfully
- Web:
  - migration assistant review UI renders validation errors/warnings
  - existing smoke coverage remains green with validation summary visible

## Acceptance criteria
- migration job detail/review response includes a structured validation summary
- validation includes deterministic blocking errors and optional warnings
- import rejects invalid reviewed draft data
- review UI surfaces validation summary before import
- `npm --workspace apps/api run test:e2e -- migration-jobs.e2e-spec.ts` passes
- `npm --workspace apps/web run test:smoke` passes
- `npm --workspace apps/web run build` passes

## Cost
- No milestone sequencing shift.
- Small M9-adjacent admin-safety hardening delta only.
- Improves import governance without widening migration scope.
