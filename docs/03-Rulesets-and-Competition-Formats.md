# 03 Rulesets and Competition Formats
Generated: 2026-02-12

This document describes how to represent rules and formats as configuration, not hard-coded logic.

## Concepts

Ruleset:
- Sport: pool | darts
- Scoring primitives (frame/leg)
- Valid win conditions
- Foul/penalty options (future)
- Defaults for match templates

Match template:
- Number of frames/legs (e.g., race-to-7, best-of-11, fixed 10 frames)
- Singles/doubles structure (future)
- Points model (league points for win/draw/loss, bonus points)
- Tie-break rules order

Points model:
- win_points
- draw_points (if allowed)
- loss_points
- bonus_points rules (optional)

Tie-break rules (ordered):
- match_points
- matches_won
- head_to_head_points
- frames_difference
- frames_won
- (then) playoff_required

## MVP Rule Support

### English 8-ball (MVP)
Minimum data: per frame winner team_id, optional player_id later.
- A fixture result is determined by total frames won by each team.
- League points awarded according to league’s points model.

Example config (JSON-ish):
- frames_total: 10
- win_condition: frames_won > opponent_frames_won
- allow_draw: false
- points_model: { win: 2, loss: 0, draw: 1 }
- tie_breakers: [match_points, frames_difference, frames_won]

### Darts 501 Double Out (Phase 3)
Minimum data: per leg winner team_id or player_id, optionally checkout / score history later.
- legs_total: configurable or “best of N”
- finish_rule: double_out true
- points model same abstraction

## Format types to support (data model readiness)
- Round-robin league
- Knockout (later)
- Groups + playoffs (later)

## Recommendation
Implement a “competition engine” that consumes:
- fixtures
- match_event_log
- ruleset config
and outputs:
- fixture result
- standings rows
