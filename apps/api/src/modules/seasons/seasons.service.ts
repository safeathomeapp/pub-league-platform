import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';

@Injectable()
export class SeasonsService {
  constructor(private prisma: PrismaService) {}

  async createSeason(
    orgId: string,
    leagueId: string,
    data: {
      name: string;
      startDate: string;
      endDate: string;
      competitionPolicy?: {
        minimumPlayersPerMatch?: number;
        hideOrdersUntilBothSubmitted?: boolean;
        preventSameTeamOpponentRepeatSameNight?: boolean;
        requireMatchSignoffOnNight?: boolean;
      };
    },
  ) {
    await this.assertLeagueInOrg(orgId, leagueId);

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (startDate >= endDate) throw new BadRequestException('startDate must be before endDate');

    const created = await this.prisma.season.create({
      data: {
        leagueId,
        name: data.name,
        startDate,
        endDate,
        ...this.mapCompetitionPolicyInput(data.competitionPolicy),
      },
    });
    return this.toSeasonResponse(created);
  }

  async listSeasons(orgId: string, leagueId: string) {
    await this.assertLeagueInOrg(orgId, leagueId);
    const seasons = await this.prisma.season.findMany({
      where: { leagueId },
      orderBy: { startDate: 'asc' },
    });
    return seasons.map(season => this.toSeasonResponse(season));
  }

  async getSeason(orgId: string, seasonId: string) {
    const season = await this.prisma.season.findFirst({
      where: {
        id: seasonId,
        league: { organisationId: orgId },
      },
    });
    if (!season) throw new NotFoundException('Season not found');
    return this.toSeasonResponse(season);
  }

  async updateSeason(
    orgId: string,
    seasonId: string,
    data: {
      name?: string;
      startDate?: string;
      endDate?: string;
      competitionPolicy?: {
        minimumPlayersPerMatch?: number;
        hideOrdersUntilBothSubmitted?: boolean;
        preventSameTeamOpponentRepeatSameNight?: boolean;
        requireMatchSignoffOnNight?: boolean;
      };
    },
  ) {
    const existing = await this.prisma.season.findFirst({
      where: {
        id: seasonId,
        league: { organisationId: orgId },
      },
    });
    if (!existing) throw new NotFoundException('Season not found');

    const startDate = data.startDate ? new Date(data.startDate) : existing.startDate;
    const endDate = data.endDate ? new Date(data.endDate) : existing.endDate;
    if (startDate >= endDate) throw new BadRequestException('startDate must be before endDate');

    const updated = await this.prisma.season.update({
      where: { id: seasonId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.startDate !== undefined ? { startDate } : {}),
        ...(data.endDate !== undefined ? { endDate } : {}),
        ...this.mapCompetitionPolicyInput(data.competitionPolicy),
      },
    });
    return this.toSeasonResponse(updated);
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

  private mapCompetitionPolicyInput(data?: {
    minimumPlayersPerMatch?: number;
    hideOrdersUntilBothSubmitted?: boolean;
    preventSameTeamOpponentRepeatSameNight?: boolean;
    requireMatchSignoffOnNight?: boolean;
  }) {
    if (!data) return {};
    return {
      ...(data.minimumPlayersPerMatch !== undefined ? { minimumPlayersPerMatch: data.minimumPlayersPerMatch } : {}),
      ...(data.hideOrdersUntilBothSubmitted !== undefined
        ? { hideOrdersUntilBothSubmitted: data.hideOrdersUntilBothSubmitted }
        : {}),
      ...(data.preventSameTeamOpponentRepeatSameNight !== undefined
        ? { preventSameTeamOpponentRepeatSameNight: data.preventSameTeamOpponentRepeatSameNight }
        : {}),
      ...(data.requireMatchSignoffOnNight !== undefined
        ? { requireMatchSignoffOnNight: data.requireMatchSignoffOnNight }
        : {}),
    };
  }

  private toSeasonResponse(season: {
    id: string;
    leagueId: string;
    name: string;
    startDate: Date;
    endDate: Date;
    minimumPlayersPerMatch: number;
    hideOrdersUntilBothSubmitted: boolean;
    preventSameTeamOpponentRepeatSameNight: boolean;
    requireMatchSignoffOnNight: boolean;
    rosterLockAfterAppearances: number;
    allowMidSeasonTransfers: boolean;
    requireAdminApprovalForTransfer: boolean;
    maxTeamChangesAfterLock: number;
  }) {
    return {
      ...season,
      competitionPolicy: {
        minimumPlayersPerMatch: season.minimumPlayersPerMatch,
        hideOrdersUntilBothSubmitted: season.hideOrdersUntilBothSubmitted,
        preventSameTeamOpponentRepeatSameNight: season.preventSameTeamOpponentRepeatSameNight,
        requireMatchSignoffOnNight: season.requireMatchSignoffOnNight,
        rosterLockAfterAppearances: season.rosterLockAfterAppearances,
        allowMidSeasonTransfers: season.allowMidSeasonTransfers,
        requireAdminApprovalForTransfer: season.requireAdminApprovalForTransfer,
        maxTeamChangesAfterLock: season.maxTeamChangesAfterLock,
      },
    };
  }
}
