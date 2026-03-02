# 29 Milestone 9 Contract - Legacy Migration Assistant
Updated: 2026-03-02

This document defines the minimal implementation contract for Milestone 9.

Implementation status:
- Implemented and validated on 2026-03-02.
- Validation pass:
  - `npm --workspace apps/api run typecheck`
  - `npm --workspace apps/api run test:e2e`
  - `npm --workspace apps/web run typecheck`
  - `npm --workspace apps/web run test:smoke`
  - `npm --workspace apps/web run build`

## 1) Goal
Deliver a migration assistant that reduces switching friction for organisers moving from legacy spreadsheets, screenshots, or existing league tools.

The thin slice must support:
- upload of migration source files
- creation and tracking of migration jobs
- review of proposed imported data before commit
- explicit admin confirmation before any import writes domain data
- audit trail for who imported what and when

## 2) Scope Boundaries
In scope:
- one org-scoped migration job model
- one upload/create endpoint
- review/read endpoints for job status and draft extracted data
- one admin web review route
- one explicit import-confirm endpoint
- import audit logging

Out of scope:
- fully automatic OCR accuracy guarantees
- silent or background auto-import
- cross-org shared imports
- bulk merge/dedup intelligence beyond simple deterministic checks
- provider-specific document AI integrations as a milestone requirement

## 3) Thin-Slice Product Decision
The first thin slice is manual-review first.

Implication:
- uploaded files may be stored with minimal metadata immediately
- extracted draft data may be entered manually or by a very small parser stub
- no imported league data becomes authoritative until an admin confirms import

This keeps scope tight while still satisfying the roadmap requirement to create, review, and import with audit.

## 4) Data Contract
### MigrationJob
Required fields:
- `id`
- `organisationId`
- `status` enum:
  - `UPLOADED`
  - `REVIEW_REQUIRED`
  - `READY_TO_IMPORT`
  - `IMPORTED`
  - `FAILED`
- `sourceType` enum:
  - `SCREENSHOT`
  - `CSV`
  - `OTHER`
- `createdByUserId`
- `createdAt`
- `updatedAt`
- `reviewedAt` nullable
- `importedAt` nullable
- `failureReason` nullable

### MigrationJobAsset
Required fields:
- `id`
- `migrationJobId`
- `originalFilename`
- `mimeType`
- `storagePath`
- `createdAt`

### MigrationJobDraft
Stored as structured JSON for thin-slice review.
Minimum draft sections:
- organisation/league metadata
- season metadata
- division rows
- team rows
- player rows
- fixture rows

### MigrationImportAudit
Required fields:
- `id`
- `organisationId`
- `migrationJobId`
- `actorUserId`
- `summaryJson`
- `createdAt`

## 5) Endpoint Contract
### POST `/api/v1/orgs/:orgId/migration-jobs`
Auth:
- Bearer JWT required
- roles: `ORG_ADMIN` or `COMMISSIONER`

Behavior:
- accepts file upload plus source metadata
- creates `MigrationJob`
- stores uploaded asset metadata
- sets initial status to `UPLOADED` or `REVIEW_REQUIRED`

### GET `/api/v1/orgs/:orgId/migration-jobs`
Behavior:
- lists migration jobs for the org
- supports optional status filter

### GET `/api/v1/orgs/:orgId/migration-jobs/:jobId`
Behavior:
- returns job metadata, assets, current review status, and draft structured data

### PATCH `/api/v1/orgs/:orgId/migration-jobs/:jobId/review`
Behavior:
- admin updates reviewed draft data
- may move job from `REVIEW_REQUIRED` to `READY_TO_IMPORT`

### POST `/api/v1/orgs/:orgId/migration-jobs/:jobId/import`
Behavior:
- requires explicit confirmation payload
- imports reviewed data into domain tables
- writes `MigrationImportAudit`
- marks job `IMPORTED`

Import rule:
- no import occurs unless this endpoint is called successfully

## 6) Validation and Safety Rules
- every query is org-scoped
- uploaded assets are linked only to their owning org job
- import endpoint must reject jobs not in `READY_TO_IMPORT`
- import writes must be deterministic and transactional
- duplicate import attempts for the same job must be rejected with conflict
- failures must surface on the job record; silent failure is unacceptable

## 7) Web Route Contract
### `/migration-assistant`
Query params:
- `orgId` required

Minimum UI sections:
- job list
- upload form
- selected job review panel
- explicit import action with confirmation text

Behavior:
- read current jobs
- upload a new source file
- edit reviewed draft fields
- display job status and failure state
- import only after explicit confirmation

## 8) Test Contract
API e2e minimum:
1. org admin can create migration job with uploaded asset metadata
2. non-member or wrong-org actor cannot read another org's jobs
3. reviewed job can be moved to `READY_TO_IMPORT`
4. import endpoint rejects non-ready jobs
5. successful import writes audit row and marks job imported
6. repeated import attempt returns conflict

Web checks minimum:
1. `apps/web` typecheck passes
2. `apps/web` build passes
3. review page handles upload/read/import errors without losing current job context

## 9) Acceptance Criteria
Milestone 9 minimal slice is done when:
- a migration job can be created from an uploaded source file
- reviewed draft data can be inspected and updated
- import occurs only after explicit confirmation
- import produces audit visibility
- org isolation and quality gates pass
