# 12 Backlog — MVP User Stories (Prioritised)
Generated: 2026-02-12
Updated: 2026-03-02

Historical backlog note:
- This file is the original MVP backlog baseline.
- Pivot-era workflow semantics are governed by `/PubLeague_Program_Schedule_Roadmap_v1.md` and `/docs/24-Pivot-Pack-New-Direction.md`.
- Where this file says direct completion, read that as governed submit/approve/reject/lock flow.

Priority legend:
- P0: must-have for public beta
- P1: should-have
- P2: later

## P0 — Tenant, Auth, Roles
- P0: As an organiser, I can register/login.
- P0: As an organiser, I can create an organisation.
- P0: As an organiser, I can invite members and assign roles.

## P0 — League Setup
- P0: Create league with sport=pool and select ruleset.
- P0: Create season and division(s).
- P0: Create teams.
- P0: Create players and assign to teams; mark captain.

## P0 — Fixtures + Calendar
- P0: Generate a round-robin schedule for a division.
- P0: View fixtures list by week.
- P0: Export fixtures as .ics feed (division + team).
- P0: Reschedule fixture and have feed reflect update.

## P0 — Match Capture + Standings
- P0: Issue match control tokens per fixture.
- P0: Captain transfers token; recipient accepts.
- P0: Token-holder records frames as events.
- P0: Token-holder submits result package; opponent approves or rejects; standings update only after lock.

## P0 — Notifications
- P0: Send 24h reminders to captains via SMS or WhatsApp.
- P0: Send notifications on fixture reschedule.
- P0: Admin can view outbox and failures.

## P0 — Disputes
- P0: Captain opens dispute on a fixture.
- P0: Commissioner resolves dispute and standings recompute.

## P1 — Quality-of-life
- P1: Player profiles with basic stats view.
- P1: Bulk import players via CSV.
- P1: Public read-only fixtures/standings link.

## P2 — Later
- P2: Offline-first local queue
- P2: Evidence uploads
- P2: Legacy migration assistant
- P2: Payments
- P2: Darts (501) sport module
