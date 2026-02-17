# Session Overview: Milestone 5 Head-to-Head Stats (LEAGUE scope)

## Scope
Implemented a new stats module and `head-to-head` endpoint for LEAGUE scope only.

## Endpoint
- `GET /api/v1/orgs/:orgId/stats/head-to-head`
- Query:
  - `playerA` (uuid, required)
  - `playerB` (uuid, required)
  - `scope` (optional, default `LEAGUE`, any other value rejected with 400)
  - `seasonId` (uuid, optional)
  - `limit` (optional int, default 10, max 50)

## Contract
Response keys:
- `scope`
- `filters.seasonId`
- `players.a.playerId`
- `players.a.displayName`
- `players.b.playerId`
- `players.b.displayName`
- `summary.matchesPlayed`
- `summary.aWins`
- `summary.bWins`
- `summary.draws`
- `summary.aFramesWon`
- `summary.bFramesWon`
- `lastMatches[]`:
  - `fixtureId`
  - `seasonId`
  - `playedAt`
  - `aFrames`
  - `bFrames`
  - `winnerPlayerId`

## Data Rules Implemented
- Counts only fixtures with `state=LOCKED`.
- Scope limited to LEAGUE path via `Fixture -> Division -> Season -> League`.
- Participation detection uses season-scoped rosters:
  - `TeamPlayer` rows on opposing fixture teams in the same fixture season.
- Excludes same-team participation.
- Uses latest `MATCH_COMPLETED` event payload (`home_frames`, `away_frames`) for scores.

## Tests Added
- `apps/api/test/stats-head-to-head.e2e-spec.ts`
  - happy path
  - season filter behavior
  - invalid scope rejection
  - non-LOCKED fixture exclusion

## Verification
- `npm --workspace apps/api run test:e2e`
- Result: all API suites passed.
