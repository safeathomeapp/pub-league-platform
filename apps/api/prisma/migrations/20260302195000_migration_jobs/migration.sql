-- CreateEnum
CREATE TYPE "MigrationJobStatus" AS ENUM ('UPLOADED', 'REVIEW_REQUIRED', 'READY_TO_IMPORT', 'IMPORTED', 'FAILED');

-- CreateEnum
CREATE TYPE "MigrationSourceType" AS ENUM ('SCREENSHOT', 'CSV', 'OTHER');

-- CreateTable
CREATE TABLE "MigrationJob" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "status" "MigrationJobStatus" NOT NULL,
    "sourceType" "MigrationSourceType" NOT NULL,
    "draft" JSONB NOT NULL,
    "failureReason" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "importedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MigrationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MigrationJobAsset" (
    "id" TEXT NOT NULL,
    "migrationJobId" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MigrationJobAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MigrationImportAudit" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "migrationJobId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "summaryJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MigrationImportAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MigrationJob_organisationId_status_createdAt_idx" ON "MigrationJob"("organisationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "MigrationJobAsset_migrationJobId_createdAt_idx" ON "MigrationJobAsset"("migrationJobId", "createdAt");

-- CreateIndex
CREATE INDEX "MigrationImportAudit_organisationId_createdAt_idx" ON "MigrationImportAudit"("organisationId", "createdAt");

-- CreateIndex
CREATE INDEX "MigrationImportAudit_migrationJobId_createdAt_idx" ON "MigrationImportAudit"("migrationJobId", "createdAt");

-- AddForeignKey
ALTER TABLE "MigrationJob" ADD CONSTRAINT "MigrationJob_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MigrationJob" ADD CONSTRAINT "MigrationJob_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MigrationJobAsset" ADD CONSTRAINT "MigrationJobAsset_migrationJobId_fkey" FOREIGN KEY ("migrationJobId") REFERENCES "MigrationJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MigrationImportAudit" ADD CONSTRAINT "MigrationImportAudit_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MigrationImportAudit" ADD CONSTRAINT "MigrationImportAudit_migrationJobId_fkey" FOREIGN KEY ("migrationJobId") REFERENCES "MigrationJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MigrationImportAudit" ADD CONSTRAINT "MigrationImportAudit_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
