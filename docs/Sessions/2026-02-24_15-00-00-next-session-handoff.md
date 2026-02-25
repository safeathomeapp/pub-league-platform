# Next Session Handoff (Action List)
Updated: 2026-02-24

This file is the immediate execution list for the next session.

## Current Project Position
- Completed through Milestone 7.
- Milestone 8 is actively in progress and has a working thin slice:
  - TV overlay API endpoint
  - TV overlay web page
  - overlay hardening pass
- Transfer reconciliation and roster role domain cleanup are complete.

## Priority Tasks (Next Session)
1. Milestone 8 closeout pass (recommended first)
- Finalize whether Milestone 8 is considered complete with current slice.
- If yes, document explicit acceptance sign-off in roadmap + handoff note.
- If no, implement only missing acceptance items from `docs/28-M8-TV-Overlay-Contract.md`.

2. Documentation convergence pass
- Update API spec docs to include pivot-era and TV overlay contracts as authoritative.
- Mark any remaining legacy-pre-pivot behavior docs as historical/superseded.
- Ensure `CHATGPT_NEXT_STEP_NOTE.md` and `PIVOT_INDEX.md` remain in lockstep.

3. Low-risk hygiene items from deep audit
- Remove duplicate `@prisma/client` entry from `apps/api/package.json` devDependencies.
- Decide whether to add minimal web smoke tests now or defer to Milestone 9 start.

4. Milestone 9 readiness decision
- If Milestone 8 is signed off, define Milestone 9 minimal contract and first thin slice before coding.

## Known Operational Notes
- Database migration history was reconciled once using:
  - `prisma migrate resolve --applied 20260224110000_transfer_effective_date`
- This was needed because earlier schema was applied via `db:push`.
- Continue using migration-first flow for schema changes.

## Validation Commands (Baseline)
- API:
  - `npm --workspace apps/api run typecheck`
  - `npm --workspace apps/api run test:e2e`
- Web:
  - `npm --workspace apps/web run typecheck`
  - `npm --workspace apps/web run build`
