# 10 Testing, QA, and Release Process
Generated: 2026-02-12

## Test layers
1) Unit tests
- ruleset calculation
- fixture generation
- standings computation
- token permission checks

2) Integration tests
- API endpoints with Postgres (test containers)
- match_event_log optimistic concurrency

3) E2E tests (minimum)
- organiser creates season
- generates fixtures
- captain records match
- standings update
- reminder job scheduled

## Data correctness tests (mandatory)
- Given a match_event_log, standings must be identical on recompute.
- Replay test: wipe standings snapshots, recompute, compare hashes.

## Release process (bootstrapped)
- main branch protected
- version tags per beta release
- migration scripts reviewed
- smoke test script for local deployment

## Observability checks
- Log sampling in dev
- notification failures visible in admin UI
