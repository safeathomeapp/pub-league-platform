# Project Handover
Date: 2026-03-03

This document is the concise handover for the repo state after the post-M9 hardening and baseline-extension pass.

## Canonical reading order
1. `/README.md`
2. `/docs/PIVOT_INDEX.md`
3. `/PubLeague_Program_Schedule_Roadmap_v1.md`
4. `/CHATGPT_NEXT_STEP_NOTE.md`
5. `/PROJECT_HANDOVER.md`

## Current product state
- Roadmap-defined work is complete through Milestone 9.
- The platform is now beyond the original roadmap and operating through explicit deltas only.
- Core league governance is stable:
  - fixture lifecycle uses canonical `Fixture.state`
  - captain/token-holder submit and opponent sign-off flow is implemented
  - disputes and locked-outcome standings are in place
- Operational baselines added after M9:
  - Docker runtime and compose smoke automation
  - persistent migration-job upload storage
  - notifications admin monitoring and outbox triage visibility
  - venue authority baseline
  - season competition policy baseline

## Major completed post-M9 deltas
- fixture lifecycle field consolidation
- web smoke coverage for match-night and disputes
- active docs convergence and root-doc entrypoint tightening
- migration assistant validation summary
- migration assistant import preview summary
- migration assistant import audit visibility
- migration assistant review draft templates
- migration assistant review draft format guard
- migration assistant review unsaved-change guard
- migration assistant review ready-state integrity
- notifications admin monitoring visibility
- notifications admin outbox triage sections
- venue authority and capacity baseline
- competition policy baseline

## Current live baseline additions
### Migration assistant
- deterministic validation summary
- deterministic import preview summary
- import audit visibility
- local template, format, dirty-state, and ready-state guardrails

### Notifications admin
- structured monitoring summary
- recent failure visibility
- triaged outbox sections for failed, queued/sending, and other items

### Venue operations
- org-scoped venues
- team venue assignment
- fixture generation capacity warnings by sport

### Competition policy
- season-level `competitionPolicy`
- organiser read/update API
- live enforcement of `minimumPlayersPerMatch` before submit and legacy complete

## Validation status
Validated during this pass:
- `npm --workspace apps/api run prisma:generate`
- `npm --workspace apps/api exec prisma migrate deploy`
- `npm --workspace apps/api run typecheck`
- `npm --workspace apps/api run test:e2e -- teams-players.e2e-spec.ts`
- `npm --workspace apps/api run test:e2e -- fixtures.e2e-spec.ts`
- `npm --workspace apps/api run test:e2e -- seasons-divisions.e2e-spec.ts`
- `npm --workspace apps/api run test:e2e -- match-events.e2e-spec.ts`
- `npm --workspace apps/web run typecheck`
- `npm --workspace apps/web run test:smoke`
- `npm --workspace apps/web run build`

## What still needs doing
Highest-value next slices:
1. Venue-aware scheduling enforcement
2. Competition policy enforcement expansion
3. Organiser authority model hardening (`TO` vs delegated admins)
4. Venue-admin operational authority

Backlog authority:
- `/PubLeague_Program_Schedule_Roadmap_v1.md`, section `9) Post-M9 controlled backlog`

Explicitly not started:
- payments / yearly player fee
- player identity claim flow
- ELO / rating system
- social integrations
- broad tournament-mode divergence

## Cross-reference notes from product usage
The repo is stable enough to compare directly against external product notes such as `rackem.app` observations.

Recommended comparison buckets:
1. Already implemented or aligned
2. Partially aligned with a clear next delta
3. Not started and should remain deferred

## Restart instructions
- Use `/CHATGPT_NEXT_STEP_NOTE.md` for the latest state.
- Use `/docs/PIVOT_INDEX.md` to navigate authoritative docs and active sessions.
- Do not start new feature work without a delta doc in `/docs/deltas/`.

## Git note
- This handover assumes the consolidated changes from this session are committed and pushed together as one repo-state sync.
