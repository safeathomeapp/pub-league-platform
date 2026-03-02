# 05 API Spec v1 (HTTP + WebSocket)
Generated: 2026-02-12
Updated: 2026-03-02

This doc is the API reference for the current implemented surface.

Pivot-era governance semantics are authoritative:
- match governance uses submit/approve/reject plus dispute/lock state transitions
- `POST /fixtures/:fixtureId/complete` remains a legacy compatibility path and is not the authoritative match-night contract
- TV overlay is implemented and part of the current surface
- WebSocket items below are historical planning only unless explicitly implemented in code

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

Authoritative fixture workflow notes:
- generic fixture patch must not be used to force governed completion
- `Fixture.state` is the authority for governance flow
- `Fixture.status` remains a compatibility field with guarded synchronization behavior

## Match control tokens
POST /orgs/:orgId/fixtures/:fixtureId/tokens:issue   (commissioner/admin)
POST /orgs/:orgId/fixtures/:fixtureId/tokens:transfer (captain/token-holder)
POST /orgs/:orgId/fixtures/:fixtureId/tokens:accept   (recipient)
GET  /orgs/:orgId/fixtures/:fixtureId/tokens          (view)

## Match governance and events
POST /orgs/:orgId/fixtures/:fixtureId/events
- Requires match control permission (token-holder or captain override)
- Requires expected_revision for optimistic concurrency

GET  /orgs/:orgId/fixtures/:fixtureId/events
POST /orgs/:orgId/fixtures/:fixtureId/submit
- body: `expectedRevision`, final score payload, acting team/player identity
- result: fixture moves into opponent sign-off flow

POST /orgs/:orgId/fixtures/:fixtureId/approve
- body: `expectedRevision`, acting team/player identity
- result: approved outcome locks fixture

POST /orgs/:orgId/fixtures/:fixtureId/reject
- body: `expectedRevision`, acting team/player identity, optional reason
- result: fixture enters dispute path

POST /orgs/:orgId/fixtures/:fixtureId/complete
- legacy compatibility endpoint
- not authoritative for new implementation decisions

## Standings / Stats
GET /orgs/:orgId/divisions/:divisionId/standings
GET /orgs/:orgId/stats/head-to-head?playerA=...&playerB=...

Standings/stat derivation rules:
- locked outcomes only
- ledger-derived, not mutable totals

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
GET /orgs/:orgId/notifications/monitoring
POST /orgs/:orgId/notifications/test

## Sponsors
GET    /orgs/:orgId/sponsors
POST   /orgs/:orgId/sponsors
PATCH  /orgs/:orgId/sponsors/:sponsorId
DELETE /orgs/:orgId/sponsors/:sponsorId

## Transfers / Rosters
POST /orgs/:orgId/seasons/:seasonId/players/:playerId/transfer
- body requires `toTeamId`, `effectiveFrom`, `reason`

GET /orgs/:orgId/seasons/:seasonId/transfers
- optional filters: `playerId`, `teamId`, `from`, `to`

## TV Overlay
GET /orgs/:orgId/tv/overlay?divisionId=...&teamId=...&at=...
- read-only overlay view model
- deterministic polling consumer on web route `/tv-overlay`
- sponsor scope filtering and active-window filtering apply

## Migration Assistant
GET   /orgs/:orgId/migration-jobs
GET   /orgs/:orgId/migration-jobs/:jobId
POST  /orgs/:orgId/migration-jobs
- multipart upload with `file`
- body field: `sourceType`

PATCH /orgs/:orgId/migration-jobs/:jobId/review
- body: `draft`, optional `readyToImport`

POST  /orgs/:orgId/migration-jobs/:jobId/import
- body: `confirm: true`
- import is explicit; no automatic import path exists

## WebSocket (real-time)
WS namespace: /ws
Events:
- fixture.updated
- fixture.started
- match.event.appended
- match.completed
- standings.updated

Auth: JWT in connection params or headers.

Implementation note:
- This WebSocket section is historical planning and not the current authoritative runtime contract.
