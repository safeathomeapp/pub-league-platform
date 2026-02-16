# 23 Minimal Help and Runbook
Generated: 2026-02-16

This is a practical quick-start and troubleshooting guide for local demo/beta use.

## 1) Local Start
From repo root:

```bash
npm run db:push
npm run seed:demo
npm run dev
```

Default URLs:
- Web: `http://localhost:3000`
- API: `http://localhost:4000/api/v1`

## 2) Demo Login
Seeded demo credentials:
- Email: `demo.organiser@publeague.local`
- Password: `demo12345`

Web shortcut:
- `http://localhost:3000/onboarding`

## 3) Minimal Demo Flow
1. Sign in as demo organiser.
2. Open `Organisations`, then open `Schedule`.
3. Load seeded division fixtures.
4. Update fixture schedule/status.
5. Submit match completion.
6. Open standings endpoint or standings UI flow.
7. Confirm notifications outbox entries exist.

## 3.1) Non-Technical UI Test Pages
- `/match-night`
  - token issue/transfer/accept
  - frame events
  - complete match
- `/disputes`
  - create/list/update disputes
- `/notifications-admin`
  - outbox filters
  - monitoring summary
  - queue test notification

## 4) Useful API Endpoints
- Auth:
  - `POST /api/v1/auth/login`
- Fixtures:
  - `GET /api/v1/orgs/:orgId/divisions/:divisionId/fixtures`
  - `PATCH /api/v1/orgs/:orgId/fixtures/:fixtureId`
- Calendar:
  - `GET /api/v1/orgs/:orgId/calendar/divisions/:divisionId.ics`
  - `GET /api/v1/orgs/:orgId/calendar/teams/:teamId.ics`
- Match + standings:
  - `POST /api/v1/orgs/:orgId/fixtures/:fixtureId/complete`
  - `GET /api/v1/orgs/:orgId/divisions/:divisionId/standings`
- Notifications:
  - `GET /api/v1/orgs/:orgId/notifications/outbox`
  - `POST /api/v1/orgs/:orgId/notifications/test`
- Disputes:
  - `POST /api/v1/orgs/:orgId/fixtures/:fixtureId/disputes`
  - `PATCH /api/v1/orgs/:orgId/disputes/:disputeId`

## 5) Common Issues
1. `401 Unauthorized`
- Cause: missing/expired bearer token.
- Fix: log in again and ensure `localStorage.accessToken` exists.

2. `403 Forbidden`
- Cause: user is not a member of org, or lacks role for endpoint.
- Fix: add membership and correct role under `/orgs/:orgId/members`.

3. `409 Revision mismatch`
- Cause: stale `expectedRevision` for match events.
- Fix: fetch latest fixture events and retry with current revision.

4. No reminder/change notifications in outbox
- Cause: no CAPTAIN players with phone numbers on fixture teams.
- Fix: ensure roster captains exist and `contactPhone` is populated.

5. Seed login fails
- Cause: seed not run or credentials changed.
- Fix: run `npm run seed:demo` and retry `demo.organiser@publeague.local` / `demo12345`.

## 6) Verification Commands
```bash
npm --workspace apps/api run test:e2e
npm --workspace apps/web run typecheck
```

## 7) Backup and Export
Use the org export endpoint for snapshot backup:

- `GET /api/v1/orgs/:orgId/export`

This returns an org-scoped JSON package including core structure, fixtures, ledger events, disputes, snapshots, and outbox rows.

## 8) Messaging Failure Monitoring
Use monitoring endpoint for failure visibility:

- `GET /api/v1/orgs/:orgId/notifications/monitoring`

Optional window query:
- `?hours=24` (range: 1 to 168)

Admin-focused outbox filters:
- `GET /api/v1/orgs/:orgId/notifications/outbox?status=failed`
- `GET /api/v1/orgs/:orgId/notifications/outbox?templateKey=fixture.completed`

## 9) Scope Reminder
- MVP is admin-first league operations.
- No payments in MVP.
- Event log is append-only; corrections use compensating events.
