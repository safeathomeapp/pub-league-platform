CREATE TABLE IF NOT EXISTS "RosterTransferAudit" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "fromTeamId" TEXT NOT NULL,
    "toTeamId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "wasAdminOverride" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RosterTransferAudit_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RosterTransferAudit_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RosterTransferAudit_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RosterTransferAudit_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RosterTransferAudit_fromTeamId_fkey" FOREIGN KEY ("fromTeamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RosterTransferAudit_toTeamId_fkey" FOREIGN KEY ("toTeamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RosterTransferAudit_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "RosterTransferAudit_organisationId_seasonId_playerId_createdAt_idx"
ON "RosterTransferAudit"("organisationId", "seasonId", "playerId", "createdAt");

ALTER TABLE "RosterTransferAudit"
ADD COLUMN IF NOT EXISTS "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "appliedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "RosterTransferAudit_organisationId_seasonId_effectiveFrom_appliedAt_idx"
ON "RosterTransferAudit"("organisationId", "seasonId", "effectiveFrom", "appliedAt");
