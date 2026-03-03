# Delta: Migration Assistant Import Preview Summary
Date: 2026-03-03

Implementation status:
- Implemented and validated on 2026-03-03.

## What changes
Add a deterministic import preview summary to the migration assistant review flow so admins can see what the import will create before confirming it. The preview will be derived from the reviewed draft already stored on the job and returned alongside validation state on job detail and review responses.

This scope stays tight:
- compute preview from the normalized reviewed draft
- show intended create counts and key references only
- do not add fuzzy matching, dry-run writes, or auto-repair behavior
- keep the existing explicit confirm-import workflow intact

## Why
Validation summary now answers "is this draft safe enough to import?" but admins still need a clearer answer to "what will this import create?" before confirming:
- preview counts reduce accidental imports
- deterministic preview aligns with governance-first review
- this is the smallest follow-on that deepens migration assistant safety without changing schema or import semantics

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
  - job detail/review returns import preview summary
  - valid draft preview reflects expected counts
- Web:
  - migration assistant review UI renders import preview summary
  - existing validation summary and smoke coverage remain green

## Acceptance criteria
- migration job detail/review response includes deterministic import preview summary
- preview shows intended create counts and key labels from the reviewed draft
- review UI surfaces preview summary before import
- import preview remains read-only and does not change import semantics
- `npm --workspace apps/api run test:e2e -- migration-jobs.e2e-spec.ts` passes
- `npm --workspace apps/web run test:smoke` passes
- `npm --workspace apps/web run build` passes

## Cost
- No milestone sequencing shift.
- Small M9-adjacent admin-review hardening delta only.
- Improves explicit import review without widening migration scope.
