import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { GenerateRoundRobinResponseDto } from './dto/generate-round-robin-response.dto';

@Injectable()
export class FixturesService {
  constructor(private prisma: PrismaService) {}

  async generateForDivision(orgId: string, divisionId: string): Promise<GenerateRoundRobinResponseDto> {
    await this.assertDivisionInOrg(orgId, divisionId);
    return this.generateRoundRobin(divisionId);
  }

  async generateRoundRobin(divisionId: string): Promise<GenerateRoundRobinResponseDto> {
    const division = await this.prisma.division.findUnique({
      where: { id: divisionId },
      include: {
        teams: { orderBy: { id: 'asc' } },
        fixtures: { select: { homeTeamId: true, awayTeamId: true } },
      },
    });

    if (!division) throw new NotFoundException('Division not found');
    if (division.teams.length < 2) throw new BadRequestException('At least two teams are required');

    const existingPairs = new Set(
      division.fixtures.map(fixture => this.pairKey(fixture.homeTeamId, fixture.awayTeamId)),
    );

    const fixturesToCreate: Array<{ divisionId: string; homeTeamId: string; awayTeamId: string; scheduledAt: null }> =
      [];

    for (let i = 0; i < division.teams.length; i += 1) {
      for (let j = i + 1; j < division.teams.length; j += 1) {
        const homeTeamId = division.teams[i].id;
        const awayTeamId = division.teams[j].id;
        const key = this.pairKey(homeTeamId, awayTeamId);

        if (existingPairs.has(key)) continue;
        fixturesToCreate.push({ divisionId, homeTeamId, awayTeamId, scheduledAt: null });
      }
    }

    if (fixturesToCreate.length === 0) {
      return { createdCount: 0, fixtures: [] };
    }

    const fixtures = await this.prisma.$transaction(
      fixturesToCreate.map(fixture => this.prisma.fixture.create({ data: fixture })),
    );

    return {
      createdCount: fixtures.length,
      fixtures: fixtures.map(fixture => ({
        id: fixture.id,
        divisionId: fixture.divisionId,
        homeTeamId: fixture.homeTeamId,
        awayTeamId: fixture.awayTeamId,
        scheduledAt: fixture.scheduledAt ? fixture.scheduledAt.toISOString() : null,
        status: fixture.status,
      })),
    };
  }

  async listForDivision(
    orgId: string,
    divisionId: string,
    query?: { from?: string; to?: string; status?: string },
  ) {
    await this.assertDivisionInOrg(orgId, divisionId);
    const scheduledAt = {
      ...(query?.from ? { gte: new Date(query.from) } : {}),
      ...(query?.to ? { lte: new Date(query.to) } : {}),
    };
    return this.prisma.fixture.findMany({
      where: {
        divisionId,
        ...(query?.status ? { status: query.status as any } : {}),
        ...(Object.keys(scheduledAt).length ? { scheduledAt } : {}),
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: [{ scheduledAt: 'asc' }, { id: 'asc' }],
    });
  }

  async getById(orgId: string, fixtureId: string) {
    const fixture = await this.prisma.fixture.findFirst({
      where: {
        id: fixtureId,
        division: { season: { league: { organisationId: orgId } } },
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });
    if (!fixture) throw new NotFoundException('Fixture not found');
    return fixture;
  }

  async update(
    orgId: string,
    fixtureId: string,
    data: { scheduledAt?: string; status?: string },
  ) {
    await this.getById(orgId, fixtureId);

    // Restrict patch behavior to explicit fields to avoid accidental model drift.
    return this.prisma.fixture.update({
      where: { id: fixtureId },
      data: {
        ...(data.scheduledAt !== undefined ? { scheduledAt: new Date(data.scheduledAt) } : {}),
        ...(data.status !== undefined ? { status: data.status as any } : {}),
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });
  }

  private async assertDivisionInOrg(orgId: string, divisionId: string): Promise<void> {
    const division = await this.prisma.division.findFirst({
      where: {
        id: divisionId,
        season: { league: { organisationId: orgId } },
      },
      select: { id: true },
    });
    if (!division) throw new NotFoundException('Division not found');
  }

  private pairKey(teamAId: string, teamBId: string): string {
    return teamAId < teamBId ? `${teamAId}:${teamBId}` : `${teamBId}:${teamAId}`;
  }
}
