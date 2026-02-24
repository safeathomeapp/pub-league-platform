# 27 Deep Code Audit (2026-02-24)

Scope: repo-wide deep audit for current implementation status, quality gates, tenant safety, and documentation alignment.

## 1) Quality Gate Results
- API typecheck: pass
- API e2e: pass (`18/18` suites, `24/24` tests)
- Web typecheck: pass
- Web build: pass

## 2) Milestone Status Matrix
- Milestone 0: complete
- Milestone 1: complete
- Milestone 2: complete
- Milestone 3: complete
- Milestone 4: complete
- Milestone 5: complete
- Milestone 6: complete
- Milestone 7: complete
- Milestone 8: not started (next)
- Milestone 9: not started

## 3) What We Have Now
- Canonical roadmap and status docs are in place:
  - `/PubLeague_Program_Schedule_Roadmap_v1.md`
  - `/CHATGPT_NEXT_STEP_NOTE.md`
  - `/docs/PIVOT_INDEX.md`
- Transfer and roster hardening now includes:
  - effective-dated transfers
  - pending transfer application tracking
  - transfer history endpoint
  - e2e coverage for future-dated behavior and org isolation

## 4) Findings (Ranked)
### Medium
1. Fixture lifecycle has dual fields (`status` and `state`) and required hardening.
- Status: partially mitigated.
- Implemented mitigation: fixtures patch now blocks direct `completed` status patch and synchronizes `state` when `status` patch is allowed.
- Residual: model still contains both fields and should be consolidated in a future migration.

2. Transfer application is lazy (request-triggered), not scheduler-driven.
- Risk: future-dated transfers may remain unapplied until specific teams/players endpoints are called.
- Suggested action: add scheduled worker or startup reconciliation pass for due transfers.

3. Team roster role uses global `Role` enum.
- Risk: domain mismatch allows non-roster values conceptually (`ORG_ADMIN`, `COMMISSIONER`) in `TeamPlayer.role`.
- Suggested action: introduce dedicated roster role enum (`CAPTAIN`, `PLAYER`) in a small migration.

4. Legacy docs still contain pre-pivot API semantics.
- Risk: contributor confusion on endpoint contract (`complete` vs submit/approve/reject flow).
- Suggested action: keep legacy docs as historical, and add explicit "superseded for pivot" markers where needed.

### Low
1. `apps/api/package.json` duplicates `@prisma/client` in dependencies and devDependencies.
- Suggested action: keep only runtime dependency entry.

2. Web has no automated test suite.
- Suggested action: add minimal smoke e2e for login + org + match-night happy path before larger Milestone 8 UI work.

## 5) Tenant Isolation and Guarding Check
- Org-scoped controllers use `JwtAuthGuard + OrgMembershipGuard` consistently.
- Role restrictions are present across domain controllers.
- Current tests include org isolation coverage for key modules (including latest transfer history path).

## 6) Recommended Next Actions
1. Begin Milestone 8 with a narrow overlay MVP contract.
2. Before building UI depth, close Medium finding #1 (fixture `status`/`state` authority rule) to avoid behavior drift.
3. Keep docs synced through `PIVOT_INDEX` and session notes only; treat older roadmap docs as historical references.
