# 26 Code Audit Inventory
Generated: 2026-02-17

This document captures code reality (API, schema, tests, web) and compares it to documented MVP scope.

## A) API Route Map
Global API prefix from bootstrap: `/api/v1`

### `apps/api/src/modules/auth/auth.controller.ts`
- Controller prefix: `auth`
- `register` | `POST` | `/api/v1/auth/register`
- `login` | `POST` | `/api/v1/auth/login`
- `me` | `GET` | `/api/v1/auth/me`

### `apps/api/src/modules/app/health.controller.ts`
- Controller prefix: `health`
- `getHealth` | `GET` | `/api/v1/health`

### `apps/api/src/modules/orgs/orgs.controller.ts`
- Controller prefix: `orgs`
- `create` | `POST` | `/api/v1/orgs`
- `list` | `GET` | `/api/v1/orgs`
- `get` | `GET` | `/api/v1/orgs/:orgId`
- `patch` | `PATCH` | `/api/v1/orgs/:orgId`

### `apps/api/src/modules/memberships/memberships.controller.ts`
- Controller prefix: `orgs/:orgId/members`
- `list` | `GET` | `/api/v1/orgs/:orgId/members`
- `add` | `POST` | `/api/v1/orgs/:orgId/members`
- `patch` | `PATCH` | `/api/v1/orgs/:orgId/members/:memberId`

### `apps/api/src/modules/rulesets/rulesets.controller.ts`
- Controller prefix: `orgs/:orgId/rulesets`
- `list` | `GET` | `/api/v1/orgs/:orgId/rulesets`
- `create` | `POST` | `/api/v1/orgs/:orgId/rulesets`
- `get` | `GET` | `/api/v1/orgs/:orgId/rulesets/:rulesetId`
- `patch` | `PATCH` | `/api/v1/orgs/:orgId/rulesets/:rulesetId`

### `apps/api/src/modules/leagues/leagues.controller.ts`
- Controller prefix: `orgs/:orgId/leagues`
- `create` | `POST` | `/api/v1/orgs/:orgId/leagues`
- `list` | `GET` | `/api/v1/orgs/:orgId/leagues`
- `get` | `GET` | `/api/v1/orgs/:orgId/leagues/:leagueId`
- `patch` | `PATCH` | `/api/v1/orgs/:orgId/leagues/:leagueId`

### `apps/api/src/modules/seasons/seasons.controller.ts`
- Controller prefix: `orgs/:orgId`
- `createSeason` | `POST` | `/api/v1/orgs/:orgId/leagues/:leagueId/seasons`
- `listSeasons` | `GET` | `/api/v1/orgs/:orgId/leagues/:leagueId/seasons`
- `createDivision` | `POST` | `/api/v1/orgs/:orgId/seasons/:seasonId/divisions`
- `listDivisions` | `GET` | `/api/v1/orgs/:orgId/seasons/:seasonId/divisions`

### `apps/api/src/modules/teams-players/teams-players.controller.ts`
- Controller prefix: `orgs/:orgId`
- `createTeam` | `POST` | `/api/v1/orgs/:orgId/divisions/:divisionId/teams`
- `listTeams` | `GET` | `/api/v1/orgs/:orgId/divisions/:divisionId/teams`
- `updateTeam` | `PATCH` | `/api/v1/orgs/:orgId/teams/:teamId`
- `createPlayer` | `POST` | `/api/v1/orgs/:orgId/players`
- `listPlayers` | `GET` | `/api/v1/orgs/:orgId/players`
- `updatePlayer` | `PATCH` | `/api/v1/orgs/:orgId/players/:playerId`
- `addTeamPlayer` | `POST` | `/api/v1/orgs/:orgId/teams/:teamId/players`
- `removeTeamPlayer` | `DELETE` | `/api/v1/orgs/:orgId/teams/:teamId/players/:playerId`

### `apps/api/src/modules/fixtures/fixtures.controller.ts`
- Controller prefix: `orgs/:orgId`
- `generate` | `POST` | `/api/v1/orgs/:orgId/divisions/:divisionId/fixtures:generate`
- `list` | `GET` | `/api/v1/orgs/:orgId/divisions/:divisionId/fixtures`
- `get` | `GET` | `/api/v1/orgs/:orgId/fixtures/:fixtureId`
- `patch` | `PATCH` | `/api/v1/orgs/:orgId/fixtures/:fixtureId`

### `apps/api/src/modules/calendar/calendar.controller.ts`
- Controller prefix: `orgs/:orgId/calendar`
- `getDivisionFeed` | `GET` | `/api/v1/orgs/:orgId/calendar/divisions/:divisionId.ics`
- `getTeamFeed` | `GET` | `/api/v1/orgs/:orgId/calendar/teams/:teamId.ics`

### `apps/api/src/modules/tokens/tokens.controller.ts`
- Controller prefix: `orgs/:orgId/fixtures/:fixtureId`
- `issue` | `POST` | `/api/v1/orgs/:orgId/fixtures/:fixtureId/tokens:issue`
- `transfer` | `POST` | `/api/v1/orgs/:orgId/fixtures/:fixtureId/tokens:transfer`
- `accept` | `POST` | `/api/v1/orgs/:orgId/fixtures/:fixtureId/tokens:accept`
- `list` | `GET` | `/api/v1/orgs/:orgId/fixtures/:fixtureId/tokens`

### `apps/api/src/modules/match-events/match-events.controller.ts`
- Controller prefix: `orgs/:orgId/fixtures/:fixtureId`
- `append` | `POST` | `/api/v1/orgs/:orgId/fixtures/:fixtureId/events`
- `list` | `GET` | `/api/v1/orgs/:orgId/fixtures/:fixtureId/events`
- `complete` | `POST` | `/api/v1/orgs/:orgId/fixtures/:fixtureId/complete`

### `apps/api/src/modules/standings/standings.controller.ts`
- Controller prefix: `orgs/:orgId/divisions/:divisionId`
- `get` | `GET` | `/api/v1/orgs/:orgId/divisions/:divisionId/standings`

### `apps/api/src/modules/disputes/disputes.controller.ts`
- Controller prefix: `orgs/:orgId`
- `create` | `POST` | `/api/v1/orgs/:orgId/fixtures/:fixtureId/disputes`
- `list` | `GET` | `/api/v1/orgs/:orgId/fixtures/:fixtureId/disputes`
- `patch` | `PATCH` | `/api/v1/orgs/:orgId/disputes/:disputeId`

### `apps/api/src/modules/notifications/notifications.controller.ts`
- Controller prefix: `orgs/:orgId/notifications`
- `listOutbox` | `GET` | `/api/v1/orgs/:orgId/notifications/outbox`
- `monitoring` | `GET` | `/api/v1/orgs/:orgId/notifications/monitoring`
- `queueTest` | `POST` | `/api/v1/orgs/:orgId/notifications/test`

### `apps/api/src/modules/exports/exports.controller.ts`
- Controller prefix: `orgs/:orgId`
- `exportOrg` | `GET` | `/api/v1/orgs/:orgId/export`

## B) Module Wiring
### AppModule imports (`apps/api/src/modules/app/app.module.ts`)
- `ConfigModule.forRoot({ isGlobal: true })`
- `PrismaModule`
- `AuthModule`
- `OrgsModule`
- `MembershipsModule`
- `FixturesModule`
- `RulesetsModule`
- `LeaguesModule`
- `SeasonsModule`
- `TeamsPlayersModule`
- `CalendarModule`
- `TokensModule`
- `MatchEventsModule`
- `StandingsModule`
- `NotificationsModule`
- `DisputesModule`
- `ExportsModule`

### App-level runtime wiring (`apps/api/src/main.ts`)
- `helmet()` enabled
- CORS enabled for `http://localhost:3000` and `http://127.0.0.1:3000`
- Global prefix: `app.setGlobalPrefix('api/v1')`
- Global validation pipe: `ValidationPipe({ whitelist: true, transform: true })`
- Global exception filter: `HttpExceptionFilter`

## C) Guards / Middleware / Filters
### Guards
- `JwtAuthGuard`
  - Applied on all protected controllers and `GET /auth/me`.
- `OrgMembershipGuard`
  - Applied where `:orgId` context is required.
  - Loads org membership and attaches `req.ctx` with `organisationId`, `role`, etc.
- `RolesGuard`
  - Applied on role-restricted controllers/routes.
  - Works with `@Roles(...)` metadata.

### Middleware
- `RequestIdMiddleware`
  - Applied globally for all routes in `AppModule.configure`.
  - Adds `req.requestId`.

### Filters
- `HttpExceptionFilter`
  - Applied globally in `main.ts`.
  - Standardizes response shape and error codes (`VALIDATION_ERROR`, `AUTH_FORBIDDEN`, `CONFLICT`, etc.).

## D) Prisma Inventory
Schema file: `apps/api/prisma/schema.prisma`

### Models
- `Organisation`
- `User`
- `OrgMembership`
- `Ruleset`
- `League`
- `Season`
- `Division`
- `Team`
- `Player`
- `TeamPlayer`
- `Fixture`
- `MatchControlToken`
- `MatchEvent`
- `StandingsSnapshot`
- `Dispute`
- `NotificationOutbox`

### Organisation-linked data
Direct `organisationId` FK:
- `OrgMembership.organisationId`
- `Ruleset.organisationId`
- `League.organisationId`
- `Player.organisationId`
- `NotificationOutbox.organisationId`

Indirect org-scoped through hierarchy:
- `Season -> League -> Organisation`
- `Division -> Season -> League -> Organisation`
- `Team -> Division -> ... -> Organisation`
- `Fixture -> Division -> ... -> Organisation`
- `MatchEvent / MatchControlToken / Dispute -> Fixture -> ... -> Organisation`
- `StandingsSnapshot.divisionId -> Division -> ... -> Organisation` (logical; currently no FK relation declared)

### Relation integrity issues / constraints gaps
- `MatchControlToken.teamId` is a plain string (no FK relation to `Team`).
- `MatchControlToken.currentHolderPlayerId` is a plain string (no FK relation to `Player`).
- `StandingsSnapshot.divisionId` is a plain string (no declared relation to `Division`).
- `MatchEvent.actorUserId` is a plain string (no declared FK to `User`).
- `Fixture` does not enforce that `homeTeamId` and `awayTeamId` belong to the same `divisionId`.
- `Dispute.status` is free-form string instead of enum.
- `MatchEvent.eventType` is free-form string instead of enum.
- `TeamPlayer.role` reuses global `Role` enum, allowing org-level roles in roster rows (domain mismatch).

## E) Tests Inventory
### API E2E tests (`apps/api/test`)
- `auth.e2e-spec.ts`: register/login/me
- `orgs.e2e-spec.ts`: create/list/get org
- `memberships.e2e-spec.ts`: add/list/update org member roles
- `rulesets.e2e-spec.ts`: create/list/get/update rulesets
- `leagues.e2e-spec.ts`: create/list/get/update leagues
- `seasons-divisions.e2e-spec.ts`: create/list seasons and divisions
- `teams-players.e2e-spec.ts`: teams, players, roster add/remove
- `fixtures.e2e-spec.ts`: round-robin generation and fixture retrieval/update
- `calendar.e2e-spec.ts`: division/team `.ics`, reschedule reflection
- `tokens.e2e-spec.ts`: token issue/transfer/accept/list
- `match-events.e2e-spec.ts`: append/list events, revision checks, complete match
- `standings.e2e-spec.ts`: deterministic standings computation from ledger events
- `disputes.e2e-spec.ts`: dispute lifecycle + standings recompute
- `notifications.e2e-spec.ts`: outbox queue, filters, monitoring summary
- `export.e2e-spec.ts`: org-scoped export package
- `errors.e2e-spec.ts`: global error shape/codes

### Current status (executed 2026-02-17)
- Command: `npm --workspace apps/api run test:e2e`
- Result: `16/16` suites passing, `16/16` tests passing

### Web tests
- No web e2e/unit tests present in repository.
- Static check status: `npm --workspace apps/web run typecheck` passes.

## F) Web Inventory
Pages in `apps/web/app`:
- `/` (`app/page.tsx`): health check and nav hub.
- `/login` (`app/login/page.tsx`): auth login form (demo credentials prefilled).
- `/register` (`app/register/page.tsx`): auth registration.
- `/orgs` (`app/orgs/page.tsx`): org list/create and navigation.
- `/schedule` (`app/schedule/page.tsx`): fixtures load/update + calendar feed preview.
- `/match-night` (`app/match-night/page.tsx`): token actions + event append + completion.
- `/standings` (`app/standings/page.tsx`): standings retrieval and table display.
- `/disputes` (`app/disputes/page.tsx`): create/list/update disputes.
- `/notifications-admin` (`app/notifications-admin/page.tsx`): outbox and monitoring.
- `/onboarding` (`app/onboarding/page.tsx`): demo bootstrap shortcut.
- `/help` (`app/help/page.tsx`): quick start and runbook links.

Current web state: minimal operator/UAT tooling, not production UX hardening.

## G) MVP Requirements Extract (Docs Truth)
Sources: `docs/02-PRD-MVP-and-Phases.md`, `docs/09-Implementation-Plan-and-Roadmap.md`, `docs/12-Backlog-MVP-User-Stories.md`

### MVP scope (functional)
- Multi-tenant org boundary and RBAC.
- Auth + org/membership management.
- League structure: rulesets, leagues, seasons, divisions, teams, players.
- Round-robin fixtures, manual fixture update, calendar feeds.
- Match governance via control tokens.
- Append-only match event log + completion flow.
- Derived standings snapshots.
- Disputes and resolution flow.
- Notifications via outbox abstraction (SMS/WhatsApp/Email adapters).
- Export/observability support.

### Milestones and done criteria (from roadmap)
- Milestone 0: Repo foundations.
  - Done when local dev runs web + api + db with one command.
- Milestone 1: Tenant + roles + core CRUD.
  - Done when organiser can create league season with teams/rosters.
- Milestone 2: Fixtures + calendar feeds.
  - Done when captains can subscribe to `.ics` and see fixtures.
- Milestone 3: Match capture + standings.
  - Done when match night flow updates standings end-to-end.
- Milestone 4: Notifications MVP.
  - Done when reminders send and failures are visible in outbox/admin.
- Milestone 5: Disputes.
  - Done when commissioner can resolve dispute and standings update.

### Public beta readiness checklist
- Seed demo data + onboarding flow.
- Minimal help docs.
- Backup/export.
- Messaging failure monitoring.

