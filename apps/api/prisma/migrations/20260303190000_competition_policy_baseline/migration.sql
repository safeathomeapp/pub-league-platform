ALTER TABLE "Season"
ADD COLUMN "minimumPlayersPerMatch" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "hideOrdersUntilBothSubmitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "preventSameTeamOpponentRepeatSameNight" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "requireMatchSignoffOnNight" BOOLEAN NOT NULL DEFAULT false;
