ALTER TABLE "RosterTransferAudit"
ADD COLUMN "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "appliedAt" TIMESTAMP(3);

CREATE INDEX "RosterTransferAudit_organisationId_seasonId_effectiveFrom_appliedAt_idx"
ON "RosterTransferAudit"("organisationId", "seasonId", "effectiveFrom", "appliedAt");
