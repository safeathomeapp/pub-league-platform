# Delta: Post-M9 Migration Asset Access
Date: 2026-03-02

Implementation status:
- Implemented on 2026-03-02.
- Validation completed locally.

## What changes
Add a narrow asset-access slice to the existing migration assistant so authorised org admins and commissioners can retrieve the uploaded source file for a migration job during review. The scope is limited to secure org-scoped read access for already-stored migration assets plus minimal web linking in the review UI. This does not expand import semantics, OCR capability, or domain data creation rules.

## Why
Milestone 9 already stores migration asset metadata and provides a review/import flow, but the current UI only shows filename and MIME type. Review is materially weaker if the organiser cannot open the uploaded screenshot/CSV they are reviewing.

This is the tightest next improvement because:
- it builds directly on the stable M9 migration assistant
- it uses the now-stable persisted upload storage path
- it improves admin review quality without introducing broader feature scope

## Impacted modules/files
- `apps/api/src/modules/migration-jobs/migration-jobs.controller.ts`
- `apps/api/src/modules/migration-jobs/migration-jobs.service.ts`
- optional DTO or response shape updates if asset access URLs are exposed explicitly
- `apps/web/app/migration-assistant/*`
- `docs/05-API-Spec-v1.md`
- `docs/29-M9-Legacy-Migration-Assistant-Contract.md`
- new session note for implementation/validation

## DB changes required
- No schema changes.
- No new migrations.

## Test additions required
- API e2e:
  - authorised org admin can fetch an asset for a job in their org
  - wrong-org or non-member actor is denied
  - missing asset returns correct not-found behavior
- Web:
  - migration assistant shows an asset-open/download affordance when assets exist
  - error state is handled without losing selected job context

## Cost
- No milestone sequencing shift.
- Small M9-adjacent admin-review hardening only.
- Keeps the next step narrow and operationally compatible with the current persisted upload storage baseline.

## Validation closeout
Completed on 2026-03-02 with:
- `npm --workspace apps/api run test:e2e -- migration-jobs.e2e-spec.ts`
- `npm --workspace apps/web run test:smoke`
- `npm --workspace apps/api run build`
- `npm --workspace apps/web run build`

Implemented behavior:
- org-scoped asset fetch endpoint for migration jobs
- wrong-org asset access denied by existing auth and org membership guards
- missing asset returns not found
- migration assistant review UI exposes an `Open` action for uploaded assets
