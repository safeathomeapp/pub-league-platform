import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FixtureState, MatchEventType } from '@prisma/client';
import { PrismaService } from '../db/prisma.service';

type MatchSlice = {
  fixtureId: string;
  seasonId: string;
  playedAt: string | null;
  aFrames: number;
  bFrames: number;
  winnerPlayerId: string | null;
};

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async headToHead(
    orgId: string,
    query: {
      playerA: string;
      playerB: string;
      scope: string;
      seasonId?: string;
      limit: number;
    },
  ) {
    if (query.scope !== 'LEAGUE') {
      throw new BadRequestException('Only LEAGUE scope is supported');
    }
    if (query.playerA === query.playerB) {
      throw new BadRequestException('playerA and playerB must be different');
    }

    const players = await this.prisma.player.findMany({
      where: {
        organisationId: orgId,
        id: { in: [query.playerA, query.playerB] },
      },
      select: { id: true, displayName: true },
    });
    const playerA = players.find(player => player.id === query.playerA);
    const playerB = players.find(player => player.id === query.playerB);
    if (!playerA || !playerB) throw new NotFoundException('Player not found');

    const fixtures = await this.prisma.fixture.findMany({
      where: {
        state: FixtureState.LOCKED,
        division: {
          season: {
            league: { organisationId: orgId },
            ...(query.seasonId ? { id: query.seasonId } : {}),
          },
        },
      },
      select: {
        id: true,
        scheduledAt: true,
        homeTeamId: true,
        awayTeamId: true,
        division: { select: { seasonId: true } },
        homeTeam: {
          select: {
            roster: {
              where: { playerId: { in: [query.playerA, query.playerB] } },
              select: { playerId: true, seasonId: true },
            },
          },
        },
        awayTeam: {
          select: {
            roster: {
              where: { playerId: { in: [query.playerA, query.playerB] } },
              select: { playerId: true, seasonId: true },
            },
          },
        },
      },
      orderBy: [{ scheduledAt: 'desc' }, { id: 'desc' }],
    });

    const candidateFixtures = fixtures.filter(fixture => {
      const seasonId = fixture.division.seasonId;
      const aOnHome = fixture.homeTeam.roster.some(r => r.playerId === query.playerA && r.seasonId === seasonId);
      const bOnHome = fixture.homeTeam.roster.some(r => r.playerId === query.playerB && r.seasonId === seasonId);
      const aOnAway = fixture.awayTeam.roster.some(r => r.playerId === query.playerA && r.seasonId === seasonId);
      const bOnAway = fixture.awayTeam.roster.some(r => r.playerId === query.playerB && r.seasonId === seasonId);

      // Must be opposing sides only (never same side).
      return (aOnHome && bOnAway) || (aOnAway && bOnHome);
    });

    if (candidateFixtures.length === 0) {
      return {
        scope: 'LEAGUE',
        filters: { seasonId: query.seasonId ?? null },
        players: {
          a: { playerId: playerA.id, displayName: playerA.displayName },
          b: { playerId: playerB.id, displayName: playerB.displayName },
        },
        summary: {
          matchesPlayed: 0,
          aWins: 0,
          bWins: 0,
          draws: 0,
          aFramesWon: 0,
          bFramesWon: 0,
        },
        lastMatches: [] as MatchSlice[],
      };
    }

    const events = await this.prisma.matchEvent.findMany({
      where: {
        fixtureId: { in: candidateFixtures.map(fixture => fixture.id) },
        eventType: MatchEventType.MATCH_COMPLETED,
      },
      select: { fixtureId: true, revision: true, payload: true },
      orderBy: [{ fixtureId: 'asc' }, { revision: 'desc' }],
    });

    const latestByFixture = new Map<string, (typeof events)[number]>();
    for (const event of events) {
      if (!latestByFixture.has(event.fixtureId)) latestByFixture.set(event.fixtureId, event);
    }

    const rows: MatchSlice[] = [];
    for (const fixture of candidateFixtures) {
      const completion = latestByFixture.get(fixture.id);
      if (!completion) continue;

      const payload = completion.payload as Record<string, unknown>;
      const homeFrames = this.toNonNegativeInt(payload.home_frames);
      const awayFrames = this.toNonNegativeInt(payload.away_frames);

      const seasonId = fixture.division.seasonId;
      const aOnHome = fixture.homeTeam.roster.some(r => r.playerId === query.playerA && r.seasonId === seasonId);
      const aFrames = aOnHome ? homeFrames : awayFrames;
      const bFrames = aOnHome ? awayFrames : homeFrames;

      rows.push({
        fixtureId: fixture.id,
        seasonId,
        playedAt: fixture.scheduledAt ? fixture.scheduledAt.toISOString() : null,
        aFrames,
        bFrames,
        winnerPlayerId: aFrames > bFrames ? query.playerA : bFrames > aFrames ? query.playerB : null,
      });
    }

    const summary = rows.reduce(
      (acc, row) => {
        acc.matchesPlayed += 1;
        acc.aFramesWon += row.aFrames;
        acc.bFramesWon += row.bFrames;
        if (row.aFrames > row.bFrames) acc.aWins += 1;
        else if (row.bFrames > row.aFrames) acc.bWins += 1;
        else acc.draws += 1;
        return acc;
      },
      {
        matchesPlayed: 0,
        aWins: 0,
        bWins: 0,
        draws: 0,
        aFramesWon: 0,
        bFramesWon: 0,
      },
    );

    return {
      scope: 'LEAGUE',
      filters: { seasonId: query.seasonId ?? null },
      players: {
        a: { playerId: playerA.id, displayName: playerA.displayName },
        b: { playerId: playerB.id, displayName: playerB.displayName },
      },
      summary,
      lastMatches: rows.slice(0, query.limit),
    };
  }

  private toNonNegativeInt(value: unknown): number {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) return 0;
    const floored = Math.floor(n);
    return floored < 0 ? 0 : floored;
  }
}
