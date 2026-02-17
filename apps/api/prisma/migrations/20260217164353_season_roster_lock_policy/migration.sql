-- AlterTable
ALTER TABLE "Season" ADD COLUMN     "allowMidSeasonTransfers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxTeamChangesAfterLock" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "requireAdminApprovalForTransfer" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "rosterLockAfterAppearances" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "RosterTransferAudit" (
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

    CONSTRAINT "RosterTransferAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RosterTransferAudit_organisationId_seasonId_playerId_create_idx" ON "RosterTransferAudit"("organisationId", "seasonId", "playerId", "createdAt");

-- AddForeignKey
ALTER TABLE "RosterTransferAudit" ADD CONSTRAINT "RosterTransferAudit_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosterTransferAudit" ADD CONSTRAINT "RosterTransferAudit_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosterTransferAudit" ADD CONSTRAINT "RosterTransferAudit_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosterTransferAudit" ADD CONSTRAINT "RosterTransferAudit_fromTeamId_fkey" FOREIGN KEY ("fromTeamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosterTransferAudit" ADD CONSTRAINT "RosterTransferAudit_toTeamId_fkey" FOREIGN KEY ("toTeamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosterTransferAudit" ADD CONSTRAINT "RosterTransferAudit_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

