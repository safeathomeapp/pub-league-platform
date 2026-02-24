import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FixtureState, SponsorScopeType } from '@prisma/client';
import { PrismaService } from '../db/prisma.service';
import { StandingsService } from '../standings/standings.service';

@Injectable()
export class TvService {
  constructor(
    private prisma: PrismaService,
    private standings: StandingsService,
  ) {}

  async getOverlay(
    orgId: string,
    query: { divisionId: string; teamId?: string; at?: string },
  ) {
    const at = query.at ? new Date(query.at) : new Date();
    if (Number.isNaN(at.getTime())) throw new BadRequestException('Invalid at timestamp');

    const division = await this.prisma.division.findFirst({
      where: {
        id: query.divisionId,
        season: { league: { organisationId: orgId } },
      },
      select: {
        id: true,
        name: true,
        season: { select: { leagueId: true } },
      },
    });
    if (!division) throw new NotFoundException('Division not found');

    if (query.teamId) {
      const team = await this.prisma.team.findFirst({
        where: {
          id: query.teamId,
          divisionId: query.divisionId,
        },
        select: { id: true },
      });
      if (!team) throw new NotFoundException('Team not found in division');
    }

    const fixtureFilter = query.teamId
      ? { OR: [{ homeTeamId: query.teamId }, { awayTeamId: query.teamId }] }
      : {};

    const fixtures = await this.prisma.fixture.findMany({
      where: {
        divisionId: query.divisionId,
        ...fixtureFilter,
      },
      include: {
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
      },
      orderBy: [{ scheduledAt: 'asc' }, { id: 'asc' }],
    });

    const liveStates = new Set<FixtureState>([
      FixtureState.IN_PROGRESS,
      FixtureState.AWAITING_OPPONENT,
      FixtureState.DISPUTED,
    ]);

    const live = fixtures
      .filter(item => liveStates.has(item.state))
      .map(item => this.mapFixture(item));

    const next = fixtures
      .filter(
        item =>
          item.state === FixtureState.SCHEDULED
          && item.scheduledAt !== null
          && item.scheduledAt >= at,
      )
      .slice(0, 5)
      .map(item => this.mapFixture(item));

    const standings = await this.standings.recomputeAndSnapshot(orgId, query.divisionId);

    const sponsors = await this.prisma.sponsorSlot.findMany({
      where: {
        organisationId: orgId,
        AND: [
          { OR: [{ startAt: null }, { startAt: { lte: at } }] },
          { OR: [{ endAt: null }, { endAt: { gte: at } }] },
          {
            OR: [
              { scopeType: SponsorScopeType.ORG },
              { scopeType: SponsorScopeType.LEAGUE, scopeId: division.season.leagueId },
              { scopeType: SponsorScopeType.DIVISION, scopeId: division.id },
            ],
          },
        ],
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        title: true,
        imageUrl: true,
        linkUrl: true,
        scopeType: true,
        scopeId: true,
      },
    });

    return {
      generatedAt: new Date().toISOString(),
      division: {
        id: division.id,
        name: division.name,
      },
      fixtures: {
        live,
        next,
      },
      standings: {
        asOf: standings.generatedAt,
        rows: standings.rows,
      },
      sponsors,
    };
  }

  private mapFixture(item: {
    id: string;
    scheduledAt: Date | null;
    state: FixtureState;
    homeTeam: { id: string; name: string };
    awayTeam: { id: string; name: string };
  }) {
    return {
      fixtureId: item.id,
      scheduledAt: item.scheduledAt?.toISOString() ?? null,
      state: item.state,
      homeTeam: item.homeTeam,
      awayTeam: item.awayTeam,
    };
  }
}
