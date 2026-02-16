# 00 Executive Summary
Generated: 2026-02-12

Goal: build an admin-first league management platform for UK English 8-ball first, then PDC-style darts (501 double-out). The primary buyer is the organiser/commissioner; players benefit via reliable stats and reminders.

Core differentiator: deterministic league tables computed from an immutable match event ledger, with governance tooling (match control tokens, audit trails, dispute workflow) to remove inconsistency and admin pain.

Constraints:
- Bootstrapped.
- ~20 hours/week average.
- Team: you + 1 dev, assisted by Codex / Claude Code.
- Local-first development; SaaS later.
- MVP must include calendar + reminders (SMS/WhatsApp) to reduce no-shows and admin overhead.

MVP success criteria (measurable):
- Organiser can set up a season (teams, schedule) in under 30 minutes.
- Captains can submit match results in under 2 minutes per fixture.
- Standings update correctly and reproducibly from the event ledger.
- Reminder delivery and calendar export work reliably.
- All score edits are auditable; disputes are trackable.

Non-goals for MVP:
- Collecting and paying out money.
- TV/venue mode (important, but later).
- Advanced analytics beyond basic player/team stats.
