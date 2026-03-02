# Next Session Handoff (Action List)
Updated: 2026-03-02

This file is the immediate execution list for the next session.

## Current Project Position
- Completed through Milestone 9.
- Milestone 8 acceptance was validated on 2026-03-02 against `docs/28-M8-TV-Overlay-Contract.md`.
- Validation pass completed:
  - `npm --workspace apps/api run typecheck`
  - `npm --workspace apps/api run test:e2e`
  - `npm --workspace apps/web run typecheck`
  - `npm --workspace apps/web run build`
- Milestone 9 acceptance was validated on 2026-03-02 against `docs/29-M9-Legacy-Migration-Assistant-Contract.md`.
- Additional validation:
  - `npm --workspace apps/web run test:smoke`
- Transfer reconciliation and roster role domain cleanup are complete.

## Priority Tasks (Next Session)
1. Roadmap next-step decision
- Current roadmap-defined work is complete through Milestone 9.
- Do not start new feature work until the next delta or milestone is documented.

2. Candidate next-scope decision
- Choose the next roadmap item from post-M9 backlog and write acceptance criteria first.
- Keep the next slice small and reversible.

3. Completed preparatory work
- Documentation convergence completed on 2026-03-02.
- Duplicate `@prisma/client` entry in `apps/api/package.json` was removed.
- Initial web smoke coverage now exists for the migration-assistant route.

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
