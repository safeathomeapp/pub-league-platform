# Delta: Migration Assistant Review Ready-State Integrity
Date: 2026-03-03

Implementation status:
- Implemented and validated on 2026-03-03.

## What changes
Automatically clear the local `readyToImport` flag whenever the migration review draft becomes dirty, and surface that behavior clearly in the review panel.

This scope stays tight:
- clear local ready state on draft edits, template application, and local formatting
- keep ready state reload/save behavior unchanged
- do not add new API fields or backend validation rules

## Why
The unsaved-change guard stops import against stale reviewed content, but the local ready checkbox could still appear checked after edits:
- ready state should reflect the exact reviewed payload only
- organisers should have to re-affirm readiness after draft changes are saved
- this is a narrow integrity improvement for the review surface only

## Impacted modules/files
- `apps/web/app/migration-assistant/*`
- `apps/web/smoke/migration-assistant.smoke.spec.tsx`
- `docs/29-M9-Legacy-Migration-Assistant-Contract.md`
- `docs/05-API-Spec-v1.md`
- session note and status docs

## DB changes required
- No schema changes.
- No migrations.

## Test additions required
- Web:
  - migration assistant review UI surfaces ready-state reset guidance
  - existing smoke coverage remains green

## Acceptance criteria
- local draft edits clear local `readyToImport`
- local template application clears local `readyToImport`
- local draft formatting clears local `readyToImport`
- user must explicitly re-check readiness after saving the reviewed draft
- `npm --workspace apps/web run typecheck` passes
- `npm --workspace apps/web run test:smoke` passes
- `npm --workspace apps/web run build` passes

## Cost
- No milestone sequencing shift.
- Small M9-adjacent review-integrity delta only.
- Improves local ready-state correctness without changing API behavior.
