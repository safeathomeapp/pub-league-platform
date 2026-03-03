# Delta: Competition Policy Baseline
Date: 2026-03-03

Implementation status:
- Implemented and validated on 2026-03-03.

## What changes
Add a season-level competition policy baseline so organisers can define a small deterministic ruleset for league operations. This slice stores policy on the season, exposes organiser read/update endpoints, and enforces `minimumPlayersPerMatch` before result submission and legacy completion.

This scope stays tight:
- keep policy at season level
- add a small fixed set of policy fields only
- enforce one live rule now: `minimumPlayersPerMatch`
- do not implement full match-order, attendance, or tournament-mode enforcement yet

## Why
The current platform has strong governance around result approval but limited organiser-configurable competition policy:
- organisers need a first-class place to set match constraints
- the product needs a deterministic baseline before broader tournament options are added
- this creates the policy surface without opening a large rules-engine rewrite

## Impacted modules/files
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/*competition_policy_baseline*`
- `apps/api/src/modules/seasons/*`
- `apps/api/src/modules/match-events/*`
- `apps/api/test/seasons-divisions.e2e-spec.ts`
- `apps/api/test/match-events.e2e-spec.ts`
- `docs/05-API-Spec-v1.md`
- `docs/04-Data-Model-and-Constraints.md`
- session note and status docs

## DB changes required
- Add season-level competition policy columns:
  - `minimumPlayersPerMatch`
  - `hideOrdersUntilBothSubmitted`
  - `preventSameTeamOpponentRepeatSameNight`
  - `requireMatchSignoffOnNight`

## Test additions required
- API e2e:
  - season create/list/get/update exposes competition policy
  - result submit and legacy complete reject matches below `minimumPlayersPerMatch`

## Acceptance criteria
- organisers can create seasons with optional competition policy
- organisers can read and patch season competition policy
- season responses expose `competitionPolicy`
- result submit and legacy complete reject when either team roster is below `minimumPlayersPerMatch`
- `npm --workspace apps/api run prisma:generate` passes
- `npm --workspace apps/api exec prisma migrate deploy` passes
- `npm --workspace apps/api run typecheck` passes
- `npm --workspace apps/api run test:e2e -- seasons-divisions.e2e-spec.ts` passes
- `npm --workspace apps/api run test:e2e -- match-events.e2e-spec.ts` passes

## Cost
- No roadmap milestone shift.
- Narrow organiser-policy baseline delta only.
- Establishes policy truth without implementing the full rules matrix yet.
