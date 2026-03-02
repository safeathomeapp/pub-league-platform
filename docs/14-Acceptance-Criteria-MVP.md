# 14 Acceptance Criteria (MVP)

Generated: 2026-02-12
Updated: 2026-03-02

This file is historical MVP baseline criteria.

Pivot-era authoritative overrides:
- governed match flow is `submit -> approve/reject -> dispute/lock`, not direct generic completion
- standings authority is locked outcomes only
- current milestone status and acceptance authority live in `/PubLeague_Program_Schedule_Roadmap_v1.md` and milestone contract docs

## League Creation

Given a logged-in organiser\
When they create a league with sport=pool\
Then the league is stored with correct ruleset and linked to
organisation.

## Fixture Generation

Given a division with ≥2 teams\
When round-robin generation is triggered\
Then fixtures are created without duplication and each team plays all
others once (home/away configurable later).

## Match Capture

Given a valid match control token holder\
When a FRAME_RECORDED event is submitted with correct expected_revision\
Then event is appended and revision increments by 1.

Given a valid authorised token holder\
When a fixture result package is submitted\
Then the fixture enters opponent sign-off flow instead of immediately becoming authoritative.

Given the opponent token holder approves a submitted result\
When approval succeeds\
Then the fixture becomes `LOCKED` and the locked outcome becomes standings authority.

## Standings

Given locked matches only\
When standings are requested\
Then standings reflect deterministic computation from match_event_log.

## Notifications

Given a scheduled fixture\
When current time = scheduled_at - 24h\
Then reminder is queued in notifications_outbox.

## Disputes

Given a fixture\
When a captain submits dispute\
Then dispute status=open and visible to commissioner.
