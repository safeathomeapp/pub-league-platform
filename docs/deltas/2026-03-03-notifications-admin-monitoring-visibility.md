# Delta: Notifications Admin Monitoring Visibility
Date: 2026-03-03

Implementation status:
- Implemented and validated on 2026-03-03.

## What changes
Replace the raw JSON dumps on `/notifications-admin` with a structured admin view for monitoring totals, recent failures, queue-test controls, and filtered outbox visibility.

This scope stays tight:
- keep the existing notifications API unchanged
- improve the admin route rendering only
- add a lightweight web smoke contract for monitoring/failure visibility
- do not add retry controls, worker logic, or new notification channels

## Why
The notifications admin route existed, but operationally it was still a raw JSON surface:
- organiser-facing failure visibility should be readable without parsing blobs
- monitoring totals and recent failures need explicit UI structure
- this is a narrow operational hardening slice that makes the existing outbox surface usable

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
  - notifications admin view renders monitoring totals and recent failures
  - notifications admin view renders empty monitoring/outbox states
  - existing web smoke coverage remains green

## Acceptance criteria
- `/notifications-admin` renders monitoring totals and recent failures in structured UI
- `/notifications-admin` renders queue-test controls and filtered outbox entries without raw JSON dumps
- empty monitoring and outbox states are readable
- `npm --workspace apps/web run typecheck` passes
- `npm --workspace apps/web run test:smoke` passes
- `npm --workspace apps/web run build` passes

## Cost
- No milestone sequencing shift.
- Narrow operational visibility delta only.
- Improves existing notifications-admin usefulness without widening notification scope.
