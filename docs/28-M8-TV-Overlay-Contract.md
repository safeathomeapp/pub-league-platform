# 28 Milestone 8 Contract - TV Overlay (Phase 2)
Updated: 2026-02-24

This document defines the minimal implementation contract for Milestone 8.

## 1) Goal
Deliver a read-only TV overlay page for venue display that shows:
- current/next fixtures
- current standings snapshot
- active sponsor slots

No write actions are allowed in overlay mode.

## 2) Scope Boundaries
In scope:
- One API view-model endpoint for overlay reads.
- One web page for overlay rendering.
- Deterministic polling refresh.
- Sponsor slot rendering with stable ordering.

Out of scope:
- WebSocket/live streaming transport.
- advanced animation engine.
- overlay authoring/config tooling.

## 3) Endpoint Contract
### GET `/api/v1/orgs/:orgId/tv/overlay`
Auth:
- Bearer JWT required (same guard stack as org-scoped reads).

Query params:
- `divisionId` (uuid, required)
- `teamId` (uuid, optional; narrows fixture list)
- `at` (ISO datetime, optional; default `now`)

Response shape:
- `generatedAt` (ISO datetime UTC)
- `division`:
  - `id`
  - `name`
- `fixtures`:
  - `live` (array, state in `IN_PROGRESS|AWAITING_OPPONENT|DISPUTED`)
  - `next` (array, max 5 ordered by scheduledAt asc)
  - item fields:
    - `fixtureId`
    - `scheduledAt`
    - `state`
    - `homeTeam` `{ id, name }`
    - `awayTeam` `{ id, name }`
- `standings`:
  - `asOf` (ISO datetime from latest snapshot)
  - `rows` (existing standings row shape)
- `sponsors`:
  - ordered by `sortOrder asc, createdAt asc`
  - fields:
    - `id`
    - `title`
    - `imageUrl`
    - `linkUrl`
    - `scopeType`
    - `scopeId`

Filtering rules:
- fixtures and standings are org-scoped via division.
- sponsor slots must be active at `at` and valid for scope:
  - ORG always eligible
  - LEAGUE eligible when slot scope matches division’s league
  - DIVISION eligible when slot scope matches division

## 4) State and Data Authority
- Overlay fixture status authority is `Fixture.state`.
- `Fixture.status` is legacy compatibility field and not used for overlay logic.
- Standings must remain derived from locked outcomes only.

## 5) Refresh Model
- Web page polls endpoint every 15 seconds.
- On fetch error:
  - keep last good payload on screen
  - show small non-blocking stale indicator
- No hard refresh required for update.

## 6) Web Route Contract
### `/tv-overlay`
Query params:
- `orgId` (required)
- `divisionId` (required)
- `teamId` (optional)

Rendering rules:
- Prioritize readability at distance (large typography, high contrast).
- Primary sections:
  - live fixtures
  - next fixtures
  - standings top rows
  - sponsor strip

## 7) Test Contract
API e2e minimum:
1. returns overlay payload for valid org/division
2. excludes non-org data
3. sponsor scope filtering and active-window filtering correct
4. fixtures partitioned correctly by `state`

Web checks minimum:
1. `apps/web` typecheck passes
2. `apps/web` build passes
3. overlay page handles missing auth and fetch failures gracefully

## 8) Acceptance Criteria
Milestone 8 minimal slice is done when:
- endpoint returns deterministic overlay payload for a seeded division
- page renders live/next fixtures, standings, and sponsors
- org isolation is enforced
- quality gates pass for touched areas
