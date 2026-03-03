export class GenerateRoundRobinResponseDto {
  createdCount!: number;
  capacityWarnings!: Array<{
    venueId: string;
    venueName: string;
    sport: string;
    teamCount: number;
    capacity: number;
    message: string;
  }>;
  fixtures!: Array<{
    id: string;
    divisionId: string;
    homeTeamId: string;
    awayTeamId: string;
    scheduledAt: string | null;
    state: string;
  }>;
}
