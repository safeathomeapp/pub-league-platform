# Delta: Root Doc Entrypoint Tightening
Date: 2026-03-03

Implementation status:
- Proposed on 2026-03-03.
- Not yet implemented.

## What changes
Tighten the repo’s entrypoint documentation so there is one explicit canonical reading path for current work. The scope is limited to root and index docs that shape how contributors and assistants start a session.

This is a docs-only slice:
- clarify which docs are authoritative right now
- distinguish active session truth from historical reference
- reduce overlapping “start here” signals across root-level docs

## Why
The code baseline, runtime baseline, and active docs have now been tightened. The remaining friction is at the repo entry layer:
- multiple docs can look like valid starting points
- some files are status-oriented while others are roadmap-oriented
- the distinction between current truth and historical reference can still be sharper

Tightening the entrypoint reduces future drift without opening new product or infrastructure scope.

## Impacted modules/files
- `README.md`
- `CHATGPT_NEXT_STEP_NOTE.md`
- `docs/PIVOT_INDEX.md`
- optional adjacent index/readme docs if needed for clarity

## DB changes required
- No schema changes.
- No migrations.

## Test additions required
- No runtime tests required.
- Validation is a documentation consistency sweep across root/index docs.

## Acceptance criteria
- root and index docs define one explicit canonical reading order for current work
- current authoritative docs are clearly separated from historical reference docs
- root entry docs do not give conflicting “start here” guidance
- handoff/index docs remain aligned after the update

## Cost
- No milestone sequencing shift.
- Small documentation-hardening delta only.
- Reduces contributor ambiguity before further scoped work.
