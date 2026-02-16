# 14 Acceptance Criteria (MVP)

Generated: 2026-02-12

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

## Standings

Given completed matches\
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
