import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';

@Injectable()
export class SeasonsService {
  constructor(private prisma: PrismaService) {}

  async createSeason(
    orgId: string,
    leagueId: string,
    data: { name: string; startDate: string; endDate: string },
  ) {
    await this.assertLeagueInOrg(orgId, leagueId);

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (startDate >= endDate) throw new BadRequestException('startDate must be before endDate');

    return this.prisma.season.create({
      data: {
        leagueId,
        name: data.name,
        startDate,
        endDate,
      },
    });
  }

  async listSeasons(orgId: string, leagueId: string) {
    await this.assertLeagueInOrg(orgId, leagueId);
    return this.prisma.season.findMany({
      where: { leagueId },
      orderBy: { startDate: 'asc' },
    });
  }

  async createDivision(orgId: string, seasonId: string, name: string) {
    await this.assertSeasonInOrg(orgId, seasonId);
    return this.prisma.division.create({
      data: { seasonId, name },
    });
  }

  async listDivisions(orgId: string, seasonId: string) {
    await this.assertSeasonInOrg(orgId, seasonId);
    return this.prisma.division.findMany({
      where: { seasonId },
      orderBy: { name: 'asc' },
    });
  }

  private async assertLeagueInOrg(orgId: string, leagueId: string): Promise<void> {
    const league = await this.prisma.league.findFirst({
      where: { id: leagueId, organisationId: orgId },
      select: { id: true },
    });
    if (!league) throw new NotFoundException('League not found');
  }

  private async assertSeasonInOrg(orgId: string, seasonId: string): Promise<void> {
    const season = await this.prisma.season.findFirst({
      where: {
        id: seasonId,
        league: { organisationId: orgId },
      },
      select: { id: true },
    });
    // Keep org ownership checks centralized to avoid missed tenant filters.
    if (!season) throw new NotFoundException('Season not found');
  }
}
