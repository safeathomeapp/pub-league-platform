# Delta: Migration Assistant Review Draft Format Guard
Date: 2026-03-03

Implementation status:
- Implemented and validated on 2026-03-03.

## What changes
Add a local draft-formatting action and clearer parse-error messaging to the migration assistant review editor so organisers can recover from malformed JSON before saving review.

This scope stays tight:
- add one local `Format draft JSON` action
- surface parse errors beside the editor
- keep save/import API behavior unchanged
- do not add server-side draft formatting or repair logic

## Why
Starter templates reduce structure mistakes, but operators can still break the draft during manual edits:
- local formatting improves readability quickly
- local parse errors reduce trial-and-error save attempts
- this is a narrow operator-safety improvement without widening migration semantics

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
  - migration assistant review UI renders the format action
  - migration assistant review UI renders local parse-error messaging
  - existing smoke coverage remains green

## Acceptance criteria
- migration assistant review UI exposes a local JSON format action
- invalid draft JSON shows a clear local parse error near the editor
- formatting and parse-error handling do not call the API
- validation, preview, import, and audit behavior remain unchanged
- `npm --workspace apps/web run typecheck` passes
- `npm --workspace apps/web run test:smoke` passes
- `npm --workspace apps/web run build` passes

## Cost
- No milestone sequencing shift.
- Small M9-adjacent editor-hardening delta only.
- Improves local recovery from malformed drafts without changing backend behavior.
