# 01 Product Vision and Scope
Generated: 2026-02-12

## Product vision
Make league admin boring: fewer arguments, fewer no-shows, fewer spreadsheets. The product is a “league operating system” that works on match night in real pubs, across unreliable connectivity, with traceable governance.

## Target users and jobs-to-be-done
Organiser/Commissioner (primary):
- Create leagues/seasons quickly
- Generate schedules and publish fixtures
- Enforce rules and resolve disputes without chaos
- Reduce admin time (reminders, exports, audit)

Captain (operational):
- Confirm lineups
- Capture match results
- Transfer scoring responsibility safely
- Receive reminders and fixture changes

Player (secondary):
- Know when/where they play
- See stats and results
- Record friendlies for personal stats (no league impact)

## Initial scope (UK only)
- English 8-ball league play (configurable match templates)
- Darts: 501, double out (added after pool MVP is stable)

## Guiding principles
1. Single source of truth: match_event_log.
2. No mutable totals: standings and stats are derived.
3. Governance built-in: token-based entry, audit, disputes.
4. Self-serve admin: minimise manual operator involvement.
5. Extensible rules: “rulesets” and “match templates” are data-driven.

## MVP user journeys
1) Organiser creates org → league → season → division → teams → fixtures → publishes calendar.
2) Captains receive reminders → capture results → confirm/lock match → standings update.
3) Commissioner reviews anomalies → resolves disputes → standings re-compute → audit preserved.
4) Players view schedules and stats; optionally record friendlies.

## Out-of-scope for MVP
- Payment collection and payouts
- White-label mobile apps
- Cross-league public ranking systems
- Streaming overlays

## Risks to manage explicitly
- Rules variation complexity: keep match templates configurable.
- Messaging delivery complexity: centralised queue + retries + observability.
- Data integrity: enforce constraints and event revision checks.
