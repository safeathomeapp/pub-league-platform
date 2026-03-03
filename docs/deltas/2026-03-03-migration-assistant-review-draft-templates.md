# Delta: Migration Assistant Review Draft Templates
Date: 2026-03-03

Implementation status:
- Implemented and validated on 2026-03-03.

## What changes
Add deterministic starter draft templates to the migration assistant review UI so organisers can begin from a known-good structure instead of hand-authoring raw JSON from scratch.

This scope stays tight:
- provide a small fixed template set in the web review editor
- populate the existing draft JSON textarea only
- keep review, validation, preview, and import behavior unchanged
- do not add parsing, inference, or server-side template selection

## Why
The migration assistant now has stronger validation, preview, and audit visibility, but authoring the review draft still starts from raw empty JSON:
- starter templates reduce structural mistakes
- deterministic templates fit governance-first review
- this improves operator speed without changing import semantics

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
  - migration assistant review UI renders the starter template actions
  - existing smoke coverage remains green

## Acceptance criteria
- migration assistant review UI exposes a small deterministic template set
- applying a template updates only the local draft editor content
- template application does not mark a job ready to import
- validation, preview, and import behavior remain unchanged
- `npm --workspace apps/web run typecheck` passes
- `npm --workspace apps/web run test:smoke` passes
- `npm --workspace apps/web run build` passes

## Cost
- No milestone sequencing shift.
- Small M9-adjacent review-UX hardening delta only.
- Improves explicit draft authoring without widening import scope.
