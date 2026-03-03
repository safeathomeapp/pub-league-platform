# Delta: Notifications Admin Outbox Triage Sections
Date: 2026-03-03

Implementation status:
- Implemented and validated on 2026-03-03.

## What changes
Split the notifications admin outbox view into explicit triage sections for failed items, queued/sending items, and other items so organisers can see queue health faster.

This scope stays tight:
- use the existing outbox payload only
- restructure the web admin rendering only
- keep filtering and monitoring endpoints unchanged
- do not add retry controls or worker actions

## Why
The previous structured view improved readability, but outbox triage still required scanning one mixed list:
- failed items should be immediately visible
- pending and sending items should be grouped as active queue work
- this is a narrow operational improvement that reduces admin scanning cost

## Impacted modules/files
- `apps/web/app/notifications-admin/*`
- `apps/web/smoke/notifications-admin.smoke.spec.tsx`
- `docs/05-API-Spec-v1.md`
- `docs/06-Notifications-Calendar-and-Messaging.md`
- session note and status docs

## DB changes required
- No schema changes.
- No migrations.

## Test additions required
- Web:
  - notifications admin view renders failed, queued/sending, and other outbox sections
  - existing web smoke coverage remains green

## Acceptance criteria
- `/notifications-admin` renders explicit outbox triage sections
- failed items are visually separated from pending/sending items
- empty triage sections have readable copy
- `npm --workspace apps/web run typecheck` passes
- `npm --workspace apps/web run test:smoke` passes
- `npm --workspace apps/web run build` passes

## Cost
- No milestone sequencing shift.
- Narrow operational triage delta only.
- Improves queue-health scanning without widening notifications scope.
