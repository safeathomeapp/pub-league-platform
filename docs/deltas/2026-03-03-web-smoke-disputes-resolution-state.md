# Delta: Web Smoke Disputes Resolution State
Date: 2026-03-03

Implementation status:
- Proposed on 2026-03-03.
- Not yet implemented.

## What changes
Add a narrow web smoke slice for the `/disputes` page, focused on dispute-state rendering rather than browser-driven interaction. The implementation will extend the existing lightweight smoke harness and verify that disputed and resolved UI states render clearly from the current data model.

The scope stays tight:
- use the current smoke-test approach only
- focus on dispute visibility and resolution-state rendering
- avoid introducing a browser stack or large UI test suite
- keep page behavior intact while extracting only the presentational layer needed for smoke coverage

This is confidence hardening, not new product functionality.

## Why
The project now has smoke coverage for migration assistant and match-night, but the dispute path remains another governance-critical UI branch:
- disputes are the organiser intervention path for contested results
- this is the main complement to the match-night captain workflow
- the roadmap and audit both favor small controlled deltas over broader test-stack expansion

Adding dispute-state smoke coverage improves regression detection on the second half of the governed lifecycle without widening scope.

## Impacted modules/files
- `apps/web/app/disputes/*`
- `apps/web/smoke/*`
- session note and status docs

## DB changes required
- No schema changes.
- No migrations.

## Test additions required
- Web smoke:
  - render a disputed fixture view with dispute metadata visible
  - render a resolved dispute outcome state
  - keep existing migration-assistant and match-night smoke suites passing

## Acceptance criteria
- a smoke test exists for dispute-state rendering using the current web smoke harness
- the test verifies disputed fixture and dispute metadata render clearly
- the test verifies resolved dispute outcome render state
- `npm --workspace apps/web run test:smoke` passes
- `npm --workspace apps/web run typecheck` passes
- `npm --workspace apps/web run build` passes

## Cost
- No milestone sequencing shift.
- Small post-M9 web-confidence hardening delta only.
- Extends coverage across both captain workflow and organiser dispute workflow.
