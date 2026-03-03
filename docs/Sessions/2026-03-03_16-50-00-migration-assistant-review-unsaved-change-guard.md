# Session Overview: Migration Assistant Review Unsaved-Change Guard

## Date
2026-03-03

## Scope
- Implemented a narrow M9-adjacent hardening slice for local review integrity.
- Added unsaved-change warning state to the migration assistant editor.
- Blocked import while the local draft differs from the last loaded or saved review state.

## Changes
- Added:
  - `docs/deltas/2026-03-03-migration-assistant-review-unsaved-change-guard.md`
- Updated:
  - `apps/web/app/migration-assistant/migration-assistant-view.tsx`
  - `apps/web/app/migration-assistant/page.tsx`
  - `apps/web/smoke/migration-assistant.smoke.spec.tsx`
  - `docs/05-API-Spec-v1.md`
  - `docs/29-M9-Legacy-Migration-Assistant-Contract.md`

## Runtime behavior
- Migration assistant review now marks local draft edits as unsaved changes.
- The review panel surfaces a clear warning while unsaved changes exist.
- Import is blocked until the edited draft is saved or reloaded from the server.
- No API contract or persistence model changed.

## Verification
- `npm --workspace apps/web run typecheck` passed
- `npm --workspace apps/web run test:smoke` passed
- `npm --workspace apps/web run build` passed

## Notes
- This slice intentionally avoids browser `beforeunload` prompts or route-intercept logic.
- The guard is local, deterministic, and scoped to the current selected job review state.
