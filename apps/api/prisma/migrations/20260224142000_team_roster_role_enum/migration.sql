CREATE TYPE "TeamRosterRole" AS ENUM ('CAPTAIN', 'PLAYER');

ALTER TABLE "TeamPlayer"
ALTER COLUMN "role" TYPE "TeamRosterRole"
USING ("role"::text::"TeamRosterRole");
