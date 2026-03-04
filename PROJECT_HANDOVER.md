# Project Handover
Updated: 2026-03-04

This is the stable root handover. It is the clean restart point for the next Codex session.

## Read first
1. `/README.md`
2. `/docs/PIVOT_INDEX.md`
3. `/PubLeague_Program_Schedule_Roadmap_v1.md`
4. `/CHATGPT_NEXT_STEP_NOTE.md`
5. `/PROJECT_HANDOVER.md`

## Current baseline
- Roadmap-defined milestone work is complete through Milestone 9.
- Post-M9 hardening is in place across runtime, fixture lifecycle, web smoke coverage, migration assistant review safety, notifications admin visibility, venue authority, and season competition policy.
- Future work must be selected from explicit deltas only.

## Cross-reference from product notes
### Already aligned
- organiser-led multi-tenant structure
- captain/token-holder result governance
- disputes and organiser escalation path
- venue/team/player hierarchy at baseline level
- TV overlay and external-consumer direction

### Partially aligned
- venue capacity exists, but scheduling enforcement is still warning-only
- organiser delegation exists coarsely, but not as explicit `TO` and `TO Admin` authority semantics
- competition policy now exists, but only `minimumPlayersPerMatch` is enforced live
- venue operations exist, but `Venue Admin` is not first-class yet

### Deferred on purpose
- payments and yearly player fee
- claimed player identity and anti-abuse controls
- ELO/rating system
- social posting integrations
- broad tournament-mode divergence

## Recommended next session focus
1. `venue-aware scheduling enforcement`
2. `competition policy enforcement expansion`
3. `organiser authority model hardening`

Reason:
- these are the tightest follow-ons from the current baseline and from the `rackem.app` cross-reference
- they improve real league operations without opening payments, identity, or wider tournament scope

## Immediate next options
1. Commit and push the root-doc cleanup so the repo restart surface stays clean.
2. Start the next explicit delta doc for `venue-aware scheduling enforcement`.
3. Run a deeper `rackem.app` gap map against specific pages or workflows from real usage notes.

## Notes for next Codex session
- Start by checking the root documentation surface and keeping the root clean.
- Treat dated handovers as archived docs under `/docs/handovers/`.
- Use roadmap section `9) Post-M9 controlled backlog` as the shortlist.
- Do not start implementation before writing a delta doc.

## Historical handovers
- Archived dated handover snapshot: `/docs/handovers/2026-03-03-project-handover.md`
