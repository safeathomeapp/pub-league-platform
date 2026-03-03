import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { FixtureState, Sport } from '@prisma/client';
import { PrismaService } from '../db/prisma.service';
import { GenerateRoundRobinResponseDto } from './dto/generate-round-robin-response.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class FixturesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async generateForDivision(orgId: string, divisionId: string): Promise<GenerateRoundRobinResponseDto> {
    await this.assertDivisionInOrg(orgId, divisionId);
    return this.generateRoundRobin(divisionId);
  }

  async generateRoundRobin(divisionId: string): Promise<GenerateRoundRobinResponseDto> {
    const division = await this.prisma.division.findUnique({
      where: { id: divisionId },
      include: {
        season: { include: { league: { select: { sport: true } } } },
        teams: { include: { venue: true }, orderBy: { id: 'asc' } },
        fixtures: { select: { homeTeamId: true, awayTeamId: true } },
      },
    });

    if (!division) throw new NotFoundException('Division not found');
    if (division.teams.length < 2) throw new BadRequestException('At least two teams are required');

    const existingPairs = new Set(
      division.fixtures.map(fixture => this.pairKey(fixture.homeTeamId, fixture.awayTeamId)),
    );
    const capacityWarnings = this.buildVenueCapacityWarnings(
      division.teams.map(team => ({
        id: team.id,
        venue: team.venue,
      })),
      division.season.league.sport,
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
      return { createdCount: 0, capacityWarnings, fixtures: [] };
    }

    const fixtures = await this.prisma.$transaction(
      fixturesToCreate.map(fixture => this.prisma.fixture.create({ data: fixture })),
    );

    return {
      createdCount: fixtures.length,
      capacityWarnings,
      fixtures: fixtures.map(fixture => ({
        id: fixture.id,
        divisionId: fixture.divisionId,
        homeTeamId: fixture.homeTeamId,
        awayTeamId: fixture.awayTeamId,
        scheduledAt: fixture.scheduledAt ? fixture.scheduledAt.toISOString() : null,
        state: fixture.state,
      })),
    };
  }

  async listForDivision(
    orgId: string,
    divisionId: string,
    query?: { from?: string; to?: string; state?: FixtureState },
  ) {
    await this.assertDivisionInOrg(orgId, divisionId);
    const scheduledAt = {
      ...(query?.from ? { gte: new Date(query.from) } : {}),
      ...(query?.to ? { lte: new Date(query.to) } : {}),
    };
    return this.prisma.fixture.findMany({
      where: {
        divisionId,
        ...(query?.state ? { state: query.state } : {}),
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
    data: { scheduledAt?: string; state?: FixtureState },
  ) {
    const existing = await this.getById(orgId, fixtureId);
    const statePatch = this.resolveStatePatch(existing.state, data.state);

    // Restrict patch behavior to explicit fields to avoid accidental model drift.
    const updated = await this.prisma.fixture.update({
      where: { id: fixtureId },
      data: {
        ...(data.scheduledAt !== undefined ? { scheduledAt: new Date(data.scheduledAt) } : {}),
        ...(statePatch ?? {}),
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    const scheduledChanged = data.scheduledAt !== undefined
      && (existing.scheduledAt?.toISOString() ?? null) !== (updated.scheduledAt?.toISOString() ?? null);
    if (scheduledChanged && updated.scheduledAt) {
      // Queue fixture change + reminder notifications through outbox pattern.
      await this.notifications.queueFixtureChangeAndReminder(orgId, fixtureId, updated.scheduledAt);
    }

    return updated;
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

  private buildVenueCapacityWarnings(
    teams: Array<{ id: string; venue: { id: string; name: string; poolTables: number; dartsBoards: number } | null }>,
    sport: Sport,
  ) {
    const teamCountsByVenue = new Map<string, { venueId: string; venueName: string; teamCount: number; capacity: number }>();

    for (const team of teams) {
      if (!team.venue) continue;
      const capacity = sport === Sport.darts ? team.venue.dartsBoards : team.venue.poolTables;
      const existing = teamCountsByVenue.get(team.venue.id);
      if (existing) {
        existing.teamCount += 1;
        continue;
      }
      teamCountsByVenue.set(team.venue.id, {
        venueId: team.venue.id,
        venueName: team.venue.name,
        teamCount: 1,
        capacity,
      });
    }

    return Array.from(teamCountsByVenue.values())
      .filter(item => item.teamCount > item.capacity)
      .map(item => ({
        venueId: item.venueId,
        venueName: item.venueName,
        sport,
        teamCount: item.teamCount,
        capacity: item.capacity,
        message: `Venue ${item.venueName} has ${item.teamCount} assigned teams for ${sport} but only capacity ${item.capacity}`,
      }));
  }

  private resolveStatePatch(
    currentState: FixtureState,
    nextState?: FixtureState,
  ): { state: FixtureState } | undefined {
    if (nextState === undefined) return undefined;

    if (
      currentState === FixtureState.AWAITING_OPPONENT
      || currentState === FixtureState.DISPUTED
      || currentState === FixtureState.LOCKED
    ) {
      throw new ConflictException('Fixture state cannot be patched from governed states');
    }

    if (nextState !== FixtureState.SCHEDULED && nextState !== FixtureState.IN_PROGRESS) {
      throw new ConflictException('Use governed match result flows for fixture lifecycle transitions');
    }

    return { state: nextState };
  }
}
