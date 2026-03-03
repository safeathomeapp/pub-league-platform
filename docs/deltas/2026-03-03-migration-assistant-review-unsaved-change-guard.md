# Delta: Migration Assistant Review Unsaved-Change Guard
Date: 2026-03-03

Implementation status:
- Implemented and validated on 2026-03-03.

## What changes
Add a local unsaved-change warning to the migration assistant review editor and block import while the local draft differs from the last loaded or saved review state.

This scope stays tight:
- track dirty state in the web editor only
- show one warning in the review panel
- block import until the review is saved
- do not add browser navigation prompts or server-side draft state

## Why
The editor now supports templates and local formatting, which makes unsaved local edits more common:
- admins need a clear signal when the local draft is ahead of the reviewed server state
- import should not proceed against stale reviewed content
- this is a narrow guardrail that improves review integrity without changing backend semantics

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
  - migration assistant review UI renders unsaved-change warning state
  - import action remains blocked while unsaved changes exist
  - existing smoke coverage remains green

## Acceptance criteria
- local draft edits mark the review editor as having unsaved changes
- review UI surfaces a clear unsaved-change warning
- import cannot proceed while unsaved changes exist
- saving or reloading job detail clears the unsaved-change warning
- `npm --workspace apps/web run typecheck` passes
- `npm --workspace apps/web run test:smoke` passes
- `npm --workspace apps/web run build` passes

## Cost
- No milestone sequencing shift.
- Small M9-adjacent editor-integrity delta only.
- Improves explicit review control without changing API behavior.
