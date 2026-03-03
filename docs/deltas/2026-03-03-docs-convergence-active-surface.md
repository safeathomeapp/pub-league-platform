# Delta: Docs Convergence Active Surface
Date: 2026-03-03

Implementation status:
- Proposed on 2026-03-03.
- Not yet implemented.

## What changes
Tighten the active documentation surface so non-archived operational and product docs reflect the current migration-first runtime baseline and pivot-era workflow semantics. The scope is limited to active docs that are still likely to guide day-to-day work; archived or explicitly historical materials are not rewritten beyond existing labels.

This is a documentation-hardening slice only:
- remove lingering `db:push` guidance from active docs
- align active wording with the submit/approve/reject/dispute workflow
- avoid rewriting archived or historical reference material

## Why
The code and runtime baseline have moved forward:
- schema changes now follow migration-first flow
- fixture lifecycle is canonical on `Fixture.state`
- web smoke coverage now spans migration assistant, match-night, and disputes

Some active docs still contain older bootstrap commands or pre-pivot phrasing. That creates contributor drift even when the code is correct.

## Impacted modules/files
- active root docs such as `README.md` if needed
- active non-archived docs under `docs/`
- handoff/index docs if the current truth set changes

## DB changes required
- No schema changes.
- No migrations.

## Test additions required
- No new runtime tests required.
- Validation is a documentation consistency sweep across active docs.

## Acceptance criteria
- active non-archived docs no longer recommend `db:push` as the normal schema path
- active non-archived docs describe pivot-era governed workflow semantics consistently
- archived/historical docs remain clearly historical rather than silently rewritten
- handoff/index docs remain aligned with the current active truth set

## Cost
- No milestone sequencing shift.
- Small documentation-hardening delta only.
- Reduces contributor confusion without widening product scope.
