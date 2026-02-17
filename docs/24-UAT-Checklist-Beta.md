# 24 UAT Checklist (Beta)
Generated: 2026-02-16

Use this checklist with a seeded local environment.

## Preflight
- [ ] Run `npm run db:push`
- [ ] Run `npm run seed:demo`
- [ ] Run `npm run dev`
- [ ] Open `http://localhost:3000/onboarding`
- [ ] Sign in with demo credentials

- Email: demo.organiser@publeague.local
- Password: demo12345


## A) Access + Org Context
- [ ] Open `Organisations` page
- [ ] At least one org is visible
- [ ] Open `Schedule` from an org

Pass criteria:
- Org list loads without errors
- Navigation to schedule works

## B) Fixtures + Calendar
- [ ] Load fixtures using `orgId` + `divisionId`
- [ ] Update one fixture time/status
- [ ] Open division `.ics` preview
- [ ] Open team `.ics` preview

Pass criteria:
- Fixture update persists after refresh
- `.ics` output renders and includes fixture entries

## C) Match Night Flow
- [ ] Open `Match Night`
- [ ] Load setup (fixtures + teams)
- [ ] Issue token for one team
- [ ] Transfer token to another player
- [ ] Accept token
- [ ] Record at least one `FRAME_RECORDED` event
- [ ] Complete match

Pass criteria:
- Token actions return success
- Event log revision increments
- Fixture status becomes `completed`

## D) Standings
- [ ] Open standings via API/UI path after completion
- [ ] Confirm standings row data updates

Pass criteria:
- Standings reflect completed match result

## E) Disputes
- [ ] Open `Disputes`
- [ ] Create dispute for fixture
- [ ] Update dispute to `resolved` with outcome

Pass criteria:
- Dispute appears in list
- Status/outcome update persists

## F) Notifications + Monitoring
- [ ] Open `Notifications Admin`
- [ ] Queue test notification
- [ ] Load outbox with and without filters
- [ ] Load monitoring summary

Pass criteria:
- Outbox rows present
- Monitoring summary returns totals and failure section shape

## G) Backup Export
- [ ] Call `GET /api/v1/orgs/:orgId/export` (token-authenticated)
- [ ] Confirm package includes fixtures, matchEventLog, disputes, standingsSnapshots, notificationsOutbox

Pass criteria:
- Export returns `formatVersion` and expected sections

## Defect Template
Use this format for failed steps:

- Step ID:
- Expected:
- Actual:
- Screenshot / JSON snippet:
- Repro frequency: always / intermittent
- Severity: blocker / major / minor
