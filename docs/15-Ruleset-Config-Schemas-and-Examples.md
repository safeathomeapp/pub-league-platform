# 15 Ruleset Config Schemas and Examples

Generated: 2026-02-12

## ruleset.schema.json (conceptual)

Fields: - sport - frames_total - allow_draw - points_model -
tie_breakers

Example (English 8-ball): { "sport": "pool", "frames_total": 10,
"allow_draw": false, "points_model": { "win": 2, "loss": 0 },
"tie_breakers": \["match_points", "frames_difference", "frames_won"\] }
