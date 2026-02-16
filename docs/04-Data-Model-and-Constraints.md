# 04 Data Model and Constraints
Generated: 2026-02-12

## Design goals
- Multi-tenant isolation via organisation_id (tenant_id).
- Immutable match ledger: match_event_log is the source of truth.
- Derived tables (standings, stats) are cached snapshots.

## Entities (MVP)
- organisations
- users
- org_memberships
- leagues
- rulesets
- seasons
- divisions
- teams
- players (domain profile; may align 1:1 with users later)
- team_players
- fixtures
- match_control_tokens
- match_event_log
- disputes
- notifications_outbox
- calendar_feeds (optional helper)
- standings_snapshots
- stats_snapshots

## Key constraints
1) Every table must contain organisation_id unless it is globally shared (rulesets may be global templates, but safer to tenant-scope early).
2) Fixture belongs to a division; division belongs to season; season belongs to league; league belongs to organisation.
3) match_event_log entries must be strictly revisioned per fixture:
   - unique (fixture_id, revision)
   - revision increments by 1 (enforced at service layer with optimistic concurrency)
4) Token ownership is single-holder at a time:
   - one active token per (fixture_id, team_id)
   - transfers create history (accepted_at, revoked_at).

## Recommended event types (MVP)
- FIXTURE_STARTED
- FRAME_RECORDED (payload: { frame_no, winner_team_id })
- MATCH_COMPLETED (payload: { home_frames, away_frames })
- MATCH_EDITED (payload: { reason })
- TOKEN_TRANSFERRED (payload: { from_user_id, to_user_id })
- DISPUTE_OPENED (payload: { dispute_id })
- DISPUTE_RESOLVED (payload: { dispute_id, outcome })

## Snapshot strategy
- standings_snapshots recomputed on:
  - MATCH_COMPLETED
  - MATCH_EDITED
  - DISPUTE_RESOLVED
- stats_snapshots recomputed similarly.

## Minimal indexes (Postgres)
- organisations(id)
- leagues(org_id)
- seasons(league_id)
- divisions(season_id)
- teams(division_id)
- fixtures(division_id, scheduled_at)
- match_event_log(fixture_id, revision) unique
- match_event_log(fixture_id, timestamp)
- match_control_tokens(fixture_id, team_id) unique where revoked_at is null

## Note on users vs players
MVP can keep:
- users: authentication identities
- players: domain entities with phone/email for reminders

Later you can unify or link 1:1.
