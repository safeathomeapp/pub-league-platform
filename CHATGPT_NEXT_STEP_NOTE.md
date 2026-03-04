# Handoff Note For ChatGPT (Next Step)
Updated: 2026-03-04

Companion to `/PubLeague_Program_Schedule_Roadmap_v1.md`.
Use this file for latest completion status and immediate next implementation action.

## Canonical reading order
For a fresh session, read in this order:
1. `/README.md` for runtime/bootstrap basics
2. `/docs/PIVOT_INDEX.md` for the current docs map
3. `/PubLeague_Program_Schedule_Roadmap_v1.md` for authoritative scope and sequencing
4. `/CHATGPT_NEXT_STEP_NOTE.md` for current completion status and the next delta prompt
5. `/PROJECT_HANDOVER.md` for concise repo-state handover

This file is status-oriented. It does not replace the roadmap or the docs index.
The roadmap now carries the controlled post-M9 backlog in section `9) Post-M9 controlled backlog`.
The root handover is now stable at `/PROJECT_HANDOVER.md`; dated snapshots belong under `/docs/handovers/`.

## Current state (completed)
- Completed through Milestone 9.
- Milestone 5: head-to-head stats endpoint implemented and tested.
- Milestone 6: sponsor slot API implemented and tested.
- Web wiring completed for:
  - sponsors admin page
  - match-night submit/approve/reject UX
- Milestone 7 implementation completed:
  - effective-dated transfers (`effectiveFrom`)
  - pending transfer application (`appliedAt`)
  - transfer history endpoint and filters
  - E2E coverage for future-dated transfer + org-scoped transfer history reads
- Milestone 8 thin slice implemented:
  - TV overlay endpoint (`/orgs/:orgId/tv/overlay`)
  - read-only `/tv-overlay` web page with polling
  - sponsor scope filtering in overlay payload
- Milestone 8 hardening pass completed:
  - improved overlay readability layout
  - expanded overlay API test coverage for team filtering and mismatch validation
- Milestone 8 acceptance validated on 2026-03-02 against `docs/28-M8-TV-Overlay-Contract.md`:
  - API e2e pass (`20/20` suites, `27/27` tests)
  - web typecheck pass
  - web build pass
  - contract requirements met for auth, org scoping, fixture partitioning, sponsor scope filtering, polling, and stale-data handling
- Transfer reconciliation hardening completed:
  - scheduler-driven due-transfer worker path
  - worker e2e coverage for non-read-triggered transfer application
- Roster role domain cleanup completed:
  - `TeamPlayer.role` now uses dedicated DB enum (`TeamRosterRole`)
  - migration + validation coverage retained
- Milestone 9 thin slice implemented and validated:
  - migration job API (`/orgs/:orgId/migration-jobs`)
  - upload asset metadata + draft review flow
  - explicit import-confirm endpoint with audit
  - `/migration-assistant` web page
  - web smoke coverage for upload/review/import UI shell
- Post-M9 runtime-hardening slice implemented in code:
  - app Dockerfiles for API and web
  - `docker-compose.yml` expanded to `postgres`, `redis`, `api`, and `web`
  - migration-first API container startup
  - separate internal web server API base support for containerized SSR
  - live Docker verification completed on 2026-03-02
  - runtime fixes applied during validation:
    - Prisma-compatible API image base and OpenSSL runtime support
    - API builder native toolchain for resilient `bcrypt` install fallback
    - API runtime `wget` for health checks
    - repaired fresh-bootstrap transfer migration path
- Post-runtime follow-on delta documented:
  - `docs/deltas/2026-03-02-post-m9-container-smoke-automation.md`
  - purpose: turn manual container validation into a repeatable smoke path before any new scope
- Post-runtime container smoke automation completed:
  - repo command: `npm run smoke:containers`
  - scripted compose up, health verification, compose status, and compose down
  - session note: `docs/Sessions/2026-03-02_22-05-00-container-smoke-automation.md`
- Migration-job upload persistence hardened:
  - API upload root is configurable via `UPLOADS_ROOT`
  - Docker compose mounts named volume `api_uploads` at `/data/uploads`
  - persistence verified by writing a sentinel file, restarting the API container, and reading the file back successfully
- Post-M9 fixture lifecycle consolidation completed:
  - `Fixture.status` removed from schema
  - `Fixture.state` is now the single lifecycle authority
  - fixture list/update API now uses `state`
  - schedule and match-night web pages updated to use canonical fixture state
  - validation completed on 2026-03-03
- Post-M9 web smoke coverage expanded:
  - added match-night smoke coverage using the existing lightweight web smoke harness
  - smoke asserts canonical fixture state rendering and submit-flow UI state
  - migration-assistant smoke retained
  - validation completed on 2026-03-03
- Post-M9 disputes smoke coverage expanded:
  - added disputes smoke coverage using the existing lightweight web smoke harness
  - smoke asserts open and resolved dispute render states
  - migration-assistant and match-night smoke retained
  - validation completed on 2026-03-03
- Post-M9 active-docs convergence completed:
  - active non-archived docs now align on migration-first flow
  - active runbook/UAT wording reflects governed fixture lifecycle semantics more clearly
  - historical docs remain historical rather than silently rewritten
- Post-M9 root-doc entrypoint tightening completed:
  - root and index docs now share one explicit reading order
  - runtime/bootstrap, roadmap, docs map, and status roles are more clearly separated
  - historical doc packs remain available but secondary
- Post-M9 migration assistant validation summary completed:
  - migration job detail and review responses now include deterministic validation summary
  - invalid reviewed drafts remain `REVIEW_REQUIRED`
  - import rejects blocking validation errors
  - migration assistant UI now surfaces validation errors and warnings before import
- Post-M9 migration assistant import preview summary completed:
  - migration job detail and review responses now include deterministic import preview summary
  - preview shows intended create counts and key labels from the reviewed draft
  - migration assistant UI now surfaces preview context before explicit import
- Post-M9 migration assistant import audit visibility completed:
  - migration assistant review now shows prior import audit history for the selected job
  - imported audit visibility includes actor, timestamp, and imported counts
  - no new import path or audit mutation behavior was added
- Post-M9 migration assistant review draft templates completed:
  - migration assistant review now exposes fixed starter templates for draft JSON
  - template application is local-only and resets ready-to-import state
  - validation, preview, and import semantics remain unchanged
- Post-M9 migration assistant review draft format guard completed:
  - migration assistant review now exposes a local JSON format action
  - invalid draft JSON now surfaces a clear local parse error near the editor
  - malformed local edits stop before save attempts hit the API
- Post-M9 migration assistant review unsaved-change guard completed:
  - migration assistant review now marks local draft edits as unsaved changes
  - import is blocked until the current review is saved or reloaded
  - warning state is local-only and does not change API behavior
- Post-M9 migration assistant review ready-state integrity completed:
  - local draft edits now clear local ready state immediately
  - template application and formatting also clear local ready state
  - readiness must be explicitly re-confirmed after saving reviewed changes
- Post-M9 notifications admin monitoring visibility completed:
  - `/notifications-admin` now renders structured monitoring totals and recent failures
  - outbox items are readable without raw JSON dumps
  - queue-test controls remain on the same minimal admin route
- Post-M9 notifications admin outbox triage sections completed:
  - `/notifications-admin` now separates failed, queued/sending, and other outbox items
  - failure triage is more immediate without changing API behavior
  - monitoring and queue-test surfaces remain unchanged
- Post-M9 venue authority and capacity baseline completed:
  - venues are now first-class org-scoped records
  - teams can now be assigned to venues
  - fixture generation now returns deterministic venue-capacity warnings for the league sport
- Post-M9 competition policy baseline completed:
  - season responses now expose organiser competition policy fields
  - organisers can patch season competition policy
  - `minimumPlayersPerMatch` is now enforced before result submit and legacy complete

## Current source session docs (active truth set)
- `docs/Sessions/2026-02-17_20-16-52-m5-head-to-head-league-scope.md`
- `docs/Sessions/2026-02-17_21-06-21-m6-sponsor-slots-minimal.md`
- `docs/Sessions/2026-02-17_22-54-23-m6-web-sponsors-admin-ui.md`
- `docs/Sessions/2026-02-17_23-12-24-web-match-night-signoff-ux.md`
- `docs/Sessions/2026-02-24_10-00-00-m7-gap-audit-transfer-roster.md`
- `docs/Sessions/2026-02-24_11-15-00-m8-contract-established.md`
- `docs/Sessions/2026-02-24_11-00-00-m7-effective-date-transfer-history.md`
- `docs/Sessions/2026-02-24_11-30-00-fixture-lifecycle-authority-hardening.md`
- `docs/Sessions/2026-02-24_12-00-00-m8-tv-overlay-thin-slice.md`
- `docs/Sessions/2026-02-24_12-45-00-m8-overlay-hardening-and-tests.md`
- `docs/Sessions/2026-02-24_13-30-00-transfer-worker-reconciliation.md`
- `docs/Sessions/2026-02-24_14-20-00-team-roster-role-enum-cleanup.md`
- `docs/Sessions/2026-02-24_15-00-00-next-session-handoff.md`
- `docs/Sessions/2026-03-02_19-38-46-docs-convergence-and-m9-contract.md`
- `docs/Sessions/2026-03-02_19-52-38-m9-migration-assistant-thin-slice.md`
- `docs/Sessions/2026-03-02_19-56-57-post-m9-delta-runtime-hardening.md`
- `docs/Sessions/2026-03-02_20-05-00-runtime-hardening-app-containers-implementation.md`
- `docs/Sessions/2026-03-02_22-05-00-container-smoke-automation.md`
- `docs/Sessions/2026-03-03_11-45-00-fixture-lifecycle-field-consolidation.md`
- `docs/Sessions/2026-03-03_13-10-00-web-smoke-match-night-happy-path.md`
- `docs/Sessions/2026-03-03_13-40-00-web-smoke-disputes-resolution-state.md`
- `docs/Sessions/2026-03-03_14-05-00-docs-convergence-active-surface.md`
- `docs/Sessions/2026-03-03_14-25-00-root-doc-entrypoint-tightening.md`
- `docs/Sessions/2026-03-03_15-05-00-migration-assistant-validation-summary.md`
- `docs/Sessions/2026-03-03_15-35-00-migration-assistant-import-preview-summary.md`
- `docs/Sessions/2026-03-03_16-00-00-migration-assistant-import-audit-visibility.md`
- `docs/Sessions/2026-03-03_16-20-00-migration-assistant-review-draft-templates.md`
- `docs/Sessions/2026-03-03_16-35-00-migration-assistant-review-draft-format-guard.md`
- `docs/Sessions/2026-03-03_16-50-00-migration-assistant-review-unsaved-change-guard.md`
- `docs/Sessions/2026-03-03_17-05-00-migration-assistant-review-ready-state-integrity.md`
- `docs/Sessions/2026-03-03_17-30-00-notifications-admin-monitoring-visibility.md`
- `docs/Sessions/2026-03-03_17-45-00-notifications-admin-outbox-triage-sections.md`
- `docs/Sessions/2026-03-03_18-20-00-venue-authority-and-capacity-baseline.md`
- `docs/Sessions/2026-03-03_19-10-00-competition-policy-baseline.md`

## Archive note
- Older session notes were moved to `docs/archive/sessions-superseded/`.
- Deep audit report: `docs/27-Deep-Code-Audit-2026-02-24.md`
- Next session checklist: `docs/Sessions/2026-02-24_15-00-00-next-session-handoff.md`

## Suggested next step (from roadmap)
The defined roadmap is implemented through Milestone 9, the runtime baseline is validated locally with Docker, the fixture lifecycle model has been consolidated, minimal web smoke coverage now includes migration-assistant, match-night, disputes, and notifications admin, the active docs surface has been converged, the root entry docs now point to one consistent reading path, and migration assistant review/import now includes deterministic validation and preview-summary behavior.
- Current runtime status:
  - `postgres`, `redis`, `api`, and `web` all start healthy via `docker compose`
  - API health returns `{"ok":true}` at `/api/v1/health`
  - web responds `200` at `http://localhost:3000`
- Current locked constraint before any feature proposal:
  - keep change control strict and document the next delta explicitly
- Current runtime baseline additions:
  - containerized migration-job uploads persist across API container restart via the `api_uploads` volume
- Current model baseline additions:
  - fixture lifecycle drift between `status` and `state` has been removed; `state` is canonical
- Current web confidence additions:
  - smoke coverage now includes migration-assistant, match-night happy-path render states, and disputes resolution-state rendering
- Current docs baseline additions:
  - active non-archived docs align on migration-first flow and current governed fixture semantics
  - root and index docs share one explicit reading order for fresh sessions
- Current migration safety additions:
  - migration assistant review/import now surfaces deterministic validation errors and warnings before import
  - migration assistant review now also surfaces deterministic import preview counts and labels before import
  - migration assistant review now also surfaces prior import audit history after import
  - migration assistant review now also exposes fixed local starter templates for draft authoring
  - migration assistant review now also exposes local draft-formatting and parse-error recovery
  - migration assistant review now also blocks import while unsaved local edits exist
  - migration assistant review now also clears local ready state when draft content changes
- Current operational visibility additions:
  - notifications admin now exposes structured monitoring totals, recent failures, and readable outbox entries
  - notifications admin now also separates failed queue items from pending/sending work for faster triage
- Current league-operations additions:
  - venues are now explicit org-scoped records with simple per-sport capacity fields
  - teams can now reference a venue
  - fixture generation now surfaces venue-capacity pressure as warning output
  - season competition policy is now first-class with baseline organiser controls
- Current backlog authority:
  - roadmap section `9) Post-M9 controlled backlog` is now the primary shortlist for next non-trivial deltas
- Current product-note cross-reference result:
  - strongest next slice remains `venue-aware scheduling enforcement`
  - follow-on slices are `competition policy enforcement expansion` and `organiser authority model hardening`

Suggested prompt:
"Choose the next narrow delta from roadmap section 9, starting with venue-aware scheduling enforcement unless a stronger blocker is found. Document it first, then implement it with tests and docs."

## Immediate operator options
1. Commit and push the current root-doc cleanup and handover tidy-up.
2. Start the next explicit delta for `venue-aware scheduling enforcement`.
3. Perform a deeper `rackem.app` workflow-by-workflow gap map before selecting the next delta.
