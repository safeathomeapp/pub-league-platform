# Delta: Web Smoke Match-Night Happy Path
Date: 2026-03-03

Implementation status:
- Proposed on 2026-03-03.
- Not yet implemented.

## What changes
Add a narrow web smoke test slice for the captain workflow on `/match-night`. The test will extend the existing lightweight web smoke harness and verify the canonical fixture-state-driven match-night flow at the UI level without introducing a new browser stack or broad end-to-end suite.

The scope is intentionally tight:
- use current smoke-test approach only
- focus on page loading and the primary submit transition
- assert canonical `Fixture.state` rendering
- avoid broad UI refactors or deep scenario matrices

This is test-confidence hardening, not new product functionality.

## Why
The roadmap-defined milestone work is complete through Milestone 9, and the runtime/model baseline has just been tightened further. The next highest-value narrow slice is confidence around the most governance-sensitive admin/captain UI path:
- match-night submit/approve/reject is central to the delegated workflow
- the project already has first web smoke coverage for migration assistant
- the deep audit recommends expanding web smoke coverage incrementally rather than building a separate large UI test stack

Adding one focused smoke path gives better regression detection on the core workflow without opening new product scope.

## Impacted modules/files
- `apps/web/smoke/*`
- `apps/web/app/match-night/page.tsx`
- smoke test utilities if needed
- session note and status docs if behavior/testing coverage changes

## DB changes required
- No schema changes.
- No migrations.

## Test additions required
- Web smoke:
  - load `/match-night` with authenticated context
  - render canonical fixture `state`
  - perform or simulate the submit-result happy path
  - verify post-submit UI reflects `AWAITING_OPPONENT`
- Keep existing migration-assistant smoke coverage passing

## Acceptance criteria
- a smoke test exists for the match-night happy path using the current web smoke harness
- the test verifies canonical fixture state is rendered by the page
- the test verifies submit flow transitions the visible state to `AWAITING_OPPONENT`
- `npm --workspace apps/web run test:smoke` passes
- `npm --workspace apps/web run typecheck` passes
- `npm --workspace apps/web run build` passes

## Cost
- No milestone sequencing shift.
- Small post-M9 confidence-hardening delta only.
- Improves regression detection on a core governed UI flow before any further scope expansion.
