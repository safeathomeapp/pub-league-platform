# Session Note: Milestone 6 Web Wiring - Sponsors Admin UI

## Date
2026-02-17 22:54:23

## Scope
- Added minimal functional admin page for SponsorSlot CRUD operations (list/create/delete).
- Reused existing auth/localStorage pattern and org query param pattern.
- No backend changes.

## Files
- apps/web/lib/api.ts
- apps/web/app/sponsors-admin/page.tsx
- apps/web/app/orgs/page.tsx
- apps/web/app/page.tsx
- apps/web/app/notifications-admin/page.tsx

## Behaviour
- Auth guard redirects to `/login` if `accessToken` missing.
- Org resolution order:
  1. `orgId` query param
  2. localStorage `selectedOrgId`
  3. first organisation from `GET /orgs`
- Sponsors page supports:
  - List: `GET /orgs/:orgId/sponsors`
  - Create: `POST /orgs/:orgId/sponsors`
  - Delete: `DELETE /orgs/:orgId/sponsors/:sponsorId`
- Basic loading and error messages added.

## Verification
- `npm --workspace apps/web run typecheck` passed.
- `npm --workspace apps/web run build` fails due pre-existing unrelated `useSearchParams` suspense issue in `/disputes` page.
- Dev server booted and `/sponsors-admin` returned HTTP 200.

## Notes
- Manual browser-auth flow (login/create/delete with UI) was not fully executed from terminal-only environment.
