CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "poolTables" INTEGER NOT NULL DEFAULT 1,
    "dartsBoards" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Team" ADD COLUMN "venueId" TEXT;

CREATE INDEX "Venue_organisationId_createdAt_idx" ON "Venue"("organisationId", "createdAt");
CREATE INDEX "Team_venueId_idx" ON "Team"("venueId");

ALTER TABLE "Venue" ADD CONSTRAINT "Venue_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Team" ADD CONSTRAINT "Team_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;
