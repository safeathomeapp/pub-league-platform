# Pivot Documentation Index
Updated: 2026-03-03

This is the single docs entry point for the pivot era.

## Reading order
For current work, read these in order:
1. `/README.md`
2. `/docs/PIVOT_INDEX.md`
3. `/PubLeague_Program_Schedule_Roadmap_v1.md`
4. `/CHATGPT_NEXT_STEP_NOTE.md`
5. `/PROJECT_HANDOVER_2026-03-03.md`

Interpretation:
- `README.md` is runtime/bootstrap guidance
- `PIVOT_INDEX.md` is the docs map
- the roadmap is scope authority
- the next-step note is current status and handoff context
- the handover doc is the concise repo-state sync for restart or transfer

## Canonical docs
- `/PubLeague_Program_Schedule_Roadmap_v1.md` (authoritative roadmap)
- `/CHATGPT_NEXT_STEP_NOTE.md` (latest implementation status + immediate next action)
- `/AGENTS.md` (operating rules and engineering guardrails)
- `/README.md` (repo boot and runtime basics)
- `/PROJECT_HANDOVER_2026-03-03.md` (concise current repo-state handover)
- `/docs/27-Deep-Code-Audit-2026-02-24.md` (current state audit and gap report)
- `/docs/28-M8-TV-Overlay-Contract.md` (Milestone 8 implementation contract)
- `/docs/29-M9-Legacy-Migration-Assistant-Contract.md` (Milestone 9 implementation contract)
- `/docs/deltas/2026-03-02-post-m9-runtime-hardening-and-app-containers.md` (next approved scope after M9)
- `/docs/deltas/2026-03-03-fixture-lifecycle-field-consolidation.md` (latest completed post-M9 hardening delta)
- `/docs/deltas/2026-03-03-web-smoke-match-night-happy-path.md` (latest completed web-confidence delta)
- `/docs/deltas/2026-03-03-web-smoke-disputes-resolution-state.md` (latest completed disputes smoke delta)
- `/docs/deltas/2026-03-03-docs-convergence-active-surface.md` (latest completed active-docs convergence delta)
- `/docs/deltas/2026-03-03-root-doc-entrypoint-tightening.md` (latest completed root-entry docs delta)
- `/docs/deltas/2026-03-03-migration-assistant-validation-summary.md` (latest completed migration review safety delta)
- `/docs/deltas/2026-03-03-migration-assistant-import-preview-summary.md` (latest completed migration preview hardening delta)
- `/docs/deltas/2026-03-03-migration-assistant-import-audit-visibility.md` (latest completed migration audit-visibility delta)
- `/docs/deltas/2026-03-03-migration-assistant-review-draft-templates.md` (latest completed migration draft-authoring delta)
- `/docs/deltas/2026-03-03-migration-assistant-review-draft-format-guard.md` (latest completed migration editor-guard delta)
- `/docs/deltas/2026-03-03-migration-assistant-review-unsaved-change-guard.md` (latest completed migration dirty-state guard delta)
- `/docs/deltas/2026-03-03-migration-assistant-review-ready-state-integrity.md` (latest completed migration ready-state integrity delta)
- `/docs/deltas/2026-03-03-notifications-admin-monitoring-visibility.md` (latest completed notifications admin visibility delta)
- `/docs/deltas/2026-03-03-notifications-admin-outbox-triage-sections.md` (latest completed notifications outbox-triage delta)
- `/docs/deltas/2026-03-03-venue-authority-and-capacity-baseline.md` (latest completed venue baseline delta)
- `/docs/deltas/2026-03-03-competition-policy-baseline.md` (latest completed competition-policy baseline delta)

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
- `/docs/Sessions/2026-03-03_11-45-00-fixture-lifecycle-field-consolidation.md`
- `/docs/Sessions/2026-03-03_13-10-00-web-smoke-match-night-happy-path.md`
- `/docs/Sessions/2026-03-03_13-40-00-web-smoke-disputes-resolution-state.md`
- `/docs/Sessions/2026-03-03_14-05-00-docs-convergence-active-surface.md`
- `/docs/Sessions/2026-03-03_14-25-00-root-doc-entrypoint-tightening.md`
- `/docs/Sessions/2026-03-03_15-05-00-migration-assistant-validation-summary.md`
- `/docs/Sessions/2026-03-03_15-35-00-migration-assistant-import-preview-summary.md`
- `/docs/Sessions/2026-03-03_16-00-00-migration-assistant-import-audit-visibility.md`
- `/docs/Sessions/2026-03-03_16-20-00-migration-assistant-review-draft-templates.md`
- `/docs/Sessions/2026-03-03_16-35-00-migration-assistant-review-draft-format-guard.md`
- `/docs/Sessions/2026-03-03_16-50-00-migration-assistant-review-unsaved-change-guard.md`
- `/docs/Sessions/2026-03-03_17-05-00-migration-assistant-review-ready-state-integrity.md`
- `/docs/Sessions/2026-03-03_17-30-00-notifications-admin-monitoring-visibility.md`
- `/docs/Sessions/2026-03-03_17-45-00-notifications-admin-outbox-triage-sections.md`
- `/docs/Sessions/2026-03-03_18-20-00-venue-authority-and-capacity-baseline.md`
- `/docs/Sessions/2026-03-03_19-10-00-competition-policy-baseline.md`

## Superseded session docs
Older session notes were archived to:
- `/docs/archive/sessions-superseded/`

## Legacy planning docs (historical, not canonical)
- `/docs/09-Implementation-Plan-and-Roadmap.md`
- `/docs/22-Milestone1-Implementation-Plan-Auth-Orgs-Roles.md`
- `/docs/25-Implementation-Plan-Pivot.md`
- `/docs/26-Code-Audit-Inventory.md`

## Historical docs
- `/docs/README.md` remains a useful historical pack index, but it is not the primary start point for current pivot-era work.

## Recommended next milestone
- No further milestone is defined in the current roadmap.
- The latest completed post-M9 hardening deltas are runtime/container baseline, migration asset access, fixture lifecycle consolidation, incremental web smoke expansion across match-night and disputes, active-docs convergence, root-doc entrypoint tightening, migration assistant validation-summary hardening, migration assistant import-preview hardening, migration assistant import-audit visibility hardening, migration assistant review draft-template hardening, migration assistant review draft-format hardening, migration assistant review unsaved-change guard hardening, migration assistant review ready-state integrity hardening, notifications admin monitoring visibility hardening, notifications admin outbox-triage hardening, venue authority/capacity baseline, and competition-policy baseline.
- The next product backlog now lives in the roadmap section `9) Post-M9 controlled backlog`.
- The handover summary for the current consolidated repo state is `/PROJECT_HANDOVER_2026-03-03.md`.
