# 27 Deep Code Audit (2026-02-24)

Scope: repo-wide deep audit for current implementation status, quality gates, tenant safety, and documentation alignment.

## 1) Quality Gate Results
- API typecheck: pass
- API e2e: pass (`20/20` suites, `27/27` tests)
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
- Milestone 8: in progress (thin slice + hardening in place)
- Milestone 9: not started

## 3) What We Have Now
- Canonical roadmap and status docs are in place:
  - `/PubLeague_Program_Schedule_Roadmap_v1.md`
  - `/CHATGPT_NEXT_STEP_NOTE.md`
  - `/docs/PIVOT_INDEX.md`
- Transfer and roster hardening now includes:
  - effective-dated transfers
  - pending transfer application tracking
  - scheduler-driven transfer reconciliation worker path
  - transfer history endpoint
  - e2e coverage for future-dated behavior and org isolation
- TV overlay capability now includes:
  - overlay API endpoint
  - overlay web page
  - overlay filtering/resilience test coverage

## 4) Findings (Ranked)
### Medium
1. Fixture lifecycle has dual fields (`status` and `state`) and required hardening.
- Status: mitigated with residual model debt.
- Implemented mitigation: fixtures patch blocks direct `completed` patch and synchronizes `state` on allowed status changes.
- Residual: both fields still exist; eventual consolidation migration is still recommended.

2. Transfer application is lazy (request-triggered), not scheduler-driven.
- Status: mitigated.
- Implemented: scheduler-driven reconcile worker path plus reconciliation e2e coverage.

3. Team roster role uses global `Role` enum.
- Status: resolved.
- Implemented: dedicated `TeamRosterRole` enum for `TeamPlayer.role` with migration and validation retained at API boundary.

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
1. Decide Milestone 8 closeout criteria and mark complete when accepted.
2. Run a docs convergence pass: pivot-era API semantics as default, legacy docs explicitly historical.
3. Address low-priority hygiene (`apps/api/package.json` duplicate `@prisma/client`, optional web smoke tests).
