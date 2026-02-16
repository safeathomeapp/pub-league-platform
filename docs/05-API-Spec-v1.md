# 05 API Spec v1 (HTTP + WebSocket)
Generated: 2026-02-12

This is a first-pass API surface for implementation. No sample JSON required; payloads are described structurally.

Base URL: /api/v1
Auth: Bearer JWT

## Auth
POST /auth/register
POST /auth/login
POST /auth/logout
GET  /auth/me

## Organisations
POST /orgs
GET  /orgs
GET  /orgs/:orgId
PATCH /orgs/:orgId

## Memberships / Roles
POST /orgs/:orgId/members (invite)
GET  /orgs/:orgId/members
PATCH /orgs/:orgId/members/:memberId (role)

## Rulesets
GET  /orgs/:orgId/rulesets
POST /orgs/:orgId/rulesets
GET  /orgs/:orgId/rulesets/:rulesetId
PATCH /orgs/:orgId/rulesets/:rulesetId

## Leagues
POST /orgs/:orgId/leagues
GET  /orgs/:orgId/leagues
GET  /orgs/:orgId/leagues/:leagueId
PATCH /orgs/:orgId/leagues/:leagueId

## Seasons / Divisions
POST /orgs/:orgId/leagues/:leagueId/seasons
GET  /orgs/:orgId/leagues/:leagueId/seasons
POST /orgs/:orgId/seasons/:seasonId/divisions
GET  /orgs/:orgId/seasons/:seasonId/divisions

## Teams
POST /orgs/:orgId/divisions/:divisionId/teams
GET  /orgs/:orgId/divisions/:divisionId/teams
PATCH /orgs/:orgId/teams/:teamId

## Players
POST /orgs/:orgId/players
GET  /orgs/:orgId/players
PATCH /orgs/:orgId/players/:playerId
POST /orgs/:orgId/teams/:teamId/players (add to roster)
DELETE /orgs/:orgId/teams/:teamId/players/:playerId (remove)

## Fixtures
POST /orgs/:orgId/divisions/:divisionId/fixtures:generate
GET  /orgs/:orgId/divisions/:divisionId/fixtures
PATCH /orgs/:orgId/fixtures/:fixtureId (reschedule/status/venue)
GET  /orgs/:orgId/fixtures/:fixtureId

## Match control tokens
POST /orgs/:orgId/fixtures/:fixtureId/tokens:issue   (commissioner/admin)
POST /orgs/:orgId/fixtures/:fixtureId/tokens:transfer (captain/token-holder)
POST /orgs/:orgId/fixtures/:fixtureId/tokens:accept   (recipient)
GET  /orgs/:orgId/fixtures/:fixtureId/tokens          (view)

## Match events (ledger writes)
POST /orgs/:orgId/fixtures/:fixtureId/events
- Requires match control permission (token-holder or captain override)
- Requires expected_revision for optimistic concurrency

GET  /orgs/:orgId/fixtures/:fixtureId/events
POST /orgs/:orgId/fixtures/:fixtureId/complete (convenience endpoint; still writes events)

## Standings / Stats
GET /orgs/:orgId/divisions/:divisionId/standings
GET /orgs/:orgId/divisions/:divisionId/stats/teams
GET /orgs/:orgId/divisions/:divisionId/stats/players

## Disputes
POST /orgs/:orgId/fixtures/:fixtureId/disputes
GET  /orgs/:orgId/fixtures/:fixtureId/disputes
PATCH /orgs/:orgId/disputes/:disputeId (status/outcome)

## Calendar
GET /orgs/:orgId/calendar/divisions/:divisionId.ics
GET /orgs/:orgId/calendar/teams/:teamId.ics
GET /orgs/:orgId/calendar/players/:playerId.ics

## Notifications (admin)
GET /orgs/:orgId/notifications/outbox
POST /orgs/:orgId/notifications/test

## WebSocket (real-time)
WS namespace: /ws
Events:
- fixture.updated
- fixture.started
- match.event.appended
- match.completed
- standings.updated

Auth: JWT in connection params or headers.
