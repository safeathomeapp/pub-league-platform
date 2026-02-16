export class GenerateRoundRobinResponseDto {
  createdCount!: number;
  fixtures!: Array<{
    id: string;
    divisionId: string;
    homeTeamId: string;
    awayTeamId: string;
    scheduledAt: string | null;
    status: string;
  }>;
}
