-- CreateEnum
CREATE TYPE "SponsorScopeType" AS ENUM ('ORG', 'LEAGUE', 'DIVISION');

-- CreateTable
CREATE TABLE "SponsorSlot" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "scopeType" "SponsorScopeType" NOT NULL,
    "scopeId" TEXT,
    "title" TEXT,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SponsorSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SponsorSlot_organisationId_scopeType_scopeId_sortOrder_crea_idx" ON "SponsorSlot"("organisationId", "scopeType", "scopeId", "sortOrder", "createdAt");

-- AddForeignKey
ALTER TABLE "SponsorSlot" ADD CONSTRAINT "SponsorSlot_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

