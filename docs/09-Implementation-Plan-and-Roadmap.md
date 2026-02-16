# 09 Implementation Plan and Roadmap
Generated: 2026-02-12

Given ~20 hours/week, bootstrapped, and “faster is better”, this is the leanest sensible order.

## Milestone 0 — Repo + foundations (week 1)
- Monorepo scaffold: /apps/web, /apps/api, /packages/shared
- Docker compose: postgres, redis
- CI: lint + typecheck + tests

Exit criteria:
- Local dev runs web + api + db with one command.

## Milestone 1 — Tenant + roles + core CRUD (weeks 2–4)
- Auth (register/login)
- Organisations + memberships + roles
- Leagues + rulesets + seasons + divisions
- Teams + players + rosters

Exit criteria:
- Organiser can create a league season with teams and rosters.

## Milestone 2 — Fixtures + calendar feeds (weeks 5–6)
- Round-robin generator
- Fixture list and reschedule
- .ics feed endpoints (division/team)
- Minimal UI to view schedule

Exit criteria:
- Captains can subscribe to .ics and see fixtures.

## Milestone 3 — Match capture + standings (weeks 7–9)
- Match control tokens (issue/transfer/accept)
- Match event logging (frame recorded)
- Match completion
- Standings snapshot computed and displayed

Exit criteria:
- End-to-end match night: record result → standings update.

## Milestone 4 — Notifications MVP (weeks 10–11)
- notifications_outbox + worker
- Reminder scheduling 24h before
- Fixture change notifications
- Admin view for failures

Exit criteria:
- SMS/WhatsApp reminders sent and visible in outbox.

## Milestone 5 — Disputes (week 12)
- Dispute create/update
- Audit visibility
- Recompute after resolution

Exit criteria:
- Commissioner can resolve a dispute and standings update accordingly.

## Public beta readiness checklist
- Seed demo data + onboarding flow
- Minimal help docs
- Backup/export
- Monitoring on messaging failures
