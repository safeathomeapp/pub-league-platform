-- Preserve Fixture.state as the canonical lifecycle authority and remove the legacy duplicate field.
ALTER TABLE "Fixture" DROP COLUMN "status";

DROP TYPE "FixtureStatus";
