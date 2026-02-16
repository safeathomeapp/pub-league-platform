# START HERE

## Current Project Status

As of **2026-02-16**, the platform has a working MVP foundation for UK pool league operations and local beta/UAT:

- Auth + org membership + RBAC are implemented.
- League setup flow exists (rulesets, leagues, seasons, divisions, teams, players).
- Round-robin fixture generation is implemented.
- Calendar feed endpoints (`.ics`) are implemented (division + team).
- Match-night governance is implemented (token issue/transfer/accept + event ledger + completion).
- Standings recompute/snapshot is implemented and exposed via API.
- Notifications outbox/admin monitoring flows exist.
- Disputes flow exists with standings recompute after resolution.
- Export/backup endpoint exists.
- Minimal non-technical web UAT pages exist for onboarding and core operational checks.

## Recent Work Completed

- Fixed API/web parity issues for local testing (global prefix + web/API integration hardening).
- Enabled API CORS for local web origin.
- Improved demo login experience (prefilled demo credentials).
- Added a dedicated web standings page:
  - `GET /api/v1/orgs/:orgId/divisions/:divisionId/standings`
- Expanded demo seed data so each team has multiple players (captain + additional players) to properly test token transfer scenarios.

## Demo Defaults

- Web: `http://localhost:3000`
- API: `http://localhost:4000/api/v1`
- Demo email: `demo.organiser@publeague.local`
- Demo password: `demo12345`

## What To Do Next

We should now move from generic MVP validation into **real-world workflow mapping** for clubs.

### Prompt for you

Please describe, in your real league operations today:

1. How pool teams organise players week-to-week (captain decisions, lineup order, absences, substitutes).
2. How darts teams organise players/matches (legs/sets format, order selection, captain authority).
3. How results are currently captured and corrected when there is a dispute.
4. Any non-negotiable league rules that must be enforced in software.

Once you provide that, we can build the next phase on top of this foundation without rework.
