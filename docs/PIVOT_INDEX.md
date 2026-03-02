# Pivot Documentation Index
Updated: 2026-03-02

This is the single docs entry point for the pivot era.

## Canonical docs
- `/PubLeague_Program_Schedule_Roadmap_v1.md` (authoritative roadmap)
- `/CHATGPT_NEXT_STEP_NOTE.md` (latest implementation status + immediate next action)
- `/AGENTS.md` (operating rules and engineering guardrails)
- `/README.md` (repo boot and runtime basics)
- `/docs/27-Deep-Code-Audit-2026-02-24.md` (current state audit and gap report)
- `/docs/28-M8-TV-Overlay-Contract.md` (Milestone 8 implementation contract)
- `/docs/29-M9-Legacy-Migration-Assistant-Contract.md` (Milestone 9 implementation contract)
- `/docs/deltas/2026-03-02-post-m9-runtime-hardening-and-app-containers.md` (next approved scope after M9)

## Current milestone checkpoint
Implementation is complete through Milestone 9.
- Milestone 8 acceptance was validated on 2026-03-02 against `/docs/28-M8-TV-Overlay-Contract.md`.
- Validation pass used:
  - `npm --workspace apps/api run typecheck`
  - `npm --workspace apps/api run test:e2e`
  - `npm --workspace apps/web run typecheck`
  - `npm --workspace apps/web run build`
- Milestone 9 acceptance was validated on 2026-03-02 against `/docs/29-M9-Legacy-Migration-Assistant-Contract.md`.
- Additional validation:
  - `npm --workspace apps/web run test:smoke`

## Active session docs (current truth set)
- `/docs/Sessions/2026-02-17_20-16-52-m5-head-to-head-league-scope.md`
- `/docs/Sessions/2026-02-17_21-06-21-m6-sponsor-slots-minimal.md`
- `/docs/Sessions/2026-02-17_22-54-23-m6-web-sponsors-admin-ui.md`
- `/docs/Sessions/2026-02-17_23-12-24-web-match-night-signoff-ux.md`
- `/docs/Sessions/2026-02-24_10-00-00-m7-gap-audit-transfer-roster.md`
- `/docs/Sessions/2026-02-24_11-00-00-m7-effective-date-transfer-history.md`
- `/docs/Sessions/2026-02-24_12-00-00-m8-tv-overlay-thin-slice.md`
- `/docs/Sessions/2026-02-24_12-45-00-m8-overlay-hardening-and-tests.md`
- `/docs/Sessions/2026-02-24_13-30-00-transfer-worker-reconciliation.md`
- `/docs/Sessions/2026-02-24_14-20-00-team-roster-role-enum-cleanup.md`
- `/docs/Sessions/2026-02-24_11-15-00-m8-contract-established.md`
- `/docs/Sessions/2026-02-24_11-30-00-fixture-lifecycle-authority-hardening.md`
- `/docs/Sessions/2026-02-24_15-00-00-next-session-handoff.md`
- `/docs/Sessions/2026-03-02_19-38-46-docs-convergence-and-m9-contract.md`
- `/docs/Sessions/2026-03-02_19-52-38-m9-migration-assistant-thin-slice.md`
- `/docs/Sessions/2026-03-02_19-56-57-post-m9-delta-runtime-hardening.md`

## Superseded session docs
Older session notes were archived to:
- `/docs/archive/sessions-superseded/`

## Legacy planning docs (historical, not canonical)
- `/docs/09-Implementation-Plan-and-Roadmap.md`
- `/docs/22-Milestone1-Implementation-Plan-Auth-Orgs-Roles.md`
- `/docs/25-Implementation-Plan-Pivot.md`
- `/docs/26-Code-Audit-Inventory.md`

## Recommended next milestone
- No further milestone is defined in the current roadmap.
- The next approved scope is the runtime-hardening delta in `/docs/deltas/2026-03-02-post-m9-runtime-hardening-and-app-containers.md`.
