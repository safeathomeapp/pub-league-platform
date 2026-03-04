# Session Note
Date: 2026-03-04
Slug: root-doc-cross-reference-and-handover-cleanup

## What changed
- Cross-referenced the `rackem.app` product notes against the current repo baseline.
- Rewrote the root handover surface to be stable and restart-oriented.
- Moved the dated handover snapshot out of the repo root into `/docs/handovers/`.
- Tightened root/doc entrypoint references so the next session starts from one clean path.

## Why
- The root folder should only expose current operational entrypoints.
- Dated handover snapshots are useful history, but they create avoidable noise in root.
- The next session needs a clear backlog recommendation based on both implemented deltas and external product notes.

## Cross-reference summary
### Already aligned
- organiser-led multi-tenant direction
- captain/token-holder match governance
- disputes and organiser escalation
- baseline venue/team/player hierarchy

### Partial with clear next deltas
- venue capacity baseline exists, but enforcement is not yet active
- competition policy baseline exists, but only one rule is enforced
- organiser delegation is still coarse and not yet explicit `TO`/`TO Admin`

### Explicitly deferred
- payments and yearly player fees
- player claim and anti-abuse
- ELO/rating
- social integrations
- broad tournament-mode divergence

## Next-session recommendation
Use the roadmap shortlist in `/PubLeague_Program_Schedule_Roadmap_v1.md`, section `9) Post-M9 controlled backlog`, with this recommended order:
1. venue-aware scheduling enforcement
2. competition policy enforcement expansion
3. organiser authority model hardening

## Immediate follow-up options
1. Commit and push this root-doc cleanup.
2. Start the `venue-aware scheduling enforcement` delta doc.
3. Cross-reference deeper `rackem.app` workflow notes against current pages before choosing the next delta.

## Root-doc cleanup result
Root now keeps only current operational docs:
- `/README.md`
- `/PubLeague_Program_Schedule_Roadmap_v1.md`
- `/CHATGPT_NEXT_STEP_NOTE.md`
- `/PROJECT_HANDOVER.md`
- `/AGENTS.md`
