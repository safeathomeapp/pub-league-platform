import { Injectable, NotFoundException } from '@nestjs/common';
import { MatchEventType, Prisma } from '@prisma/client';
import { PrismaService } from '../db/prisma.service';

type StandingsRow = {
  teamId: string;
  teamName: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesDrawn: number;
  matchesLost: number;
  framesWon: number;
  framesLost: number;
  framesDifference: number;
  matchPoints: number;
};

@Injectable()
export class StandingsService {
  constructor(private prisma: PrismaService) {}

  async recomputeAndSnapshot(orgId: string, divisionId: string) {
    const division = await this.prisma.division.findFirst({
      where: {
        id: divisionId,
        season: { league: { organisationId: orgId } },
      },
      include: {
        teams: { orderBy: { name: 'asc' } },
        fixtures: { select: { id: true, homeTeamId: true, awayTeamId: true } },
        season: { include: { league: { include: { ruleset: true } } } },
      },
    });
    if (!division) throw new NotFoundException('Division not found');

    const pointModel = this.resolvePointsModel(division.season.league.ruleset.config as Prisma.JsonValue);
    const rowsByTeamId = new Map<string, StandingsRow>();
    for (const team of division.teams) {
      rowsByTeamId.set(team.id, {
        teamId: team.id,
        teamName: team.name,
        matchesPlayed: 0,
        matchesWon: 0,
        matchesDrawn: 0,
        matchesLost: 0,
        framesWon: 0,
        framesLost: 0,
        framesDifference: 0,
        matchPoints: 0,
      });
    }

    if (division.fixtures.length > 0) {
      const events = await this.prisma.matchEvent.findMany({
        where: {
          fixtureId: { in: division.fixtures.map(fixture => fixture.id) },
          eventType: MatchEventType.MATCH_COMPLETED,
        },
        orderBy: [{ fixtureId: 'asc' }, { revision: 'desc' }],
      });

      const latestByFixture = new Map<string, (typeof events)[number]>();
      for (const event of events) {
        if (!latestByFixture.has(event.fixtureId)) latestByFixture.set(event.fixtureId, event);
      }

      const fixtureById = new Map(division.fixtures.map(fixture => [fixture.id, fixture]));

      for (const [fixtureId, event] of latestByFixture) {
        const fixture = fixtureById.get(fixtureId);
        if (!fixture) continue;

        const payload = event.payload as Record<string, unknown>;
        const homeFrames = this.toNonNegativeInt(payload.home_frames);
        const awayFrames = this.toNonNegativeInt(payload.away_frames);

        const home = rowsByTeamId.get(fixture.homeTeamId);
        const away = rowsByTeamId.get(fixture.awayTeamId);
        if (!home || !away) continue;

        home.matchesPlayed += 1;
        away.matchesPlayed += 1;
        home.framesWon += homeFrames;
        home.framesLost += awayFrames;
        away.framesWon += awayFrames;
        away.framesLost += homeFrames;

        if (homeFrames > awayFrames) {
          home.matchesWon += 1;
          away.matchesLost += 1;
          home.matchPoints += pointModel.win;
          away.matchPoints += pointModel.loss;
        } else if (awayFrames > homeFrames) {
          away.matchesWon += 1;
          home.matchesLost += 1;
          away.matchPoints += pointModel.win;
          home.matchPoints += pointModel.loss;
        } else {
          home.matchesDrawn += 1;
          away.matchesDrawn += 1;
          home.matchPoints += pointModel.draw;
          away.matchPoints += pointModel.draw;
        }
      }
    }

    const rows = Array.from(rowsByTeamId.values()).map(row => ({
      ...row,
      framesDifference: row.framesWon - row.framesLost,
    }));

    rows.sort((a, b) => {
      if (b.matchPoints !== a.matchPoints) return b.matchPoints - a.matchPoints;
      if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon;
      if (b.framesDifference !== a.framesDifference) return b.framesDifference - a.framesDifference;
      if (b.framesWon !== a.framesWon) return b.framesWon - a.framesWon;
      return a.teamName.localeCompare(b.teamName);
    });

    const data = {
      divisionId,
      generatedAt: new Date().toISOString(),
      pointsModel: pointModel,
      rows,
    };

    const snapshot = await this.prisma.standingsSnapshot.create({
      data: {
        divisionId,
        data: data as Prisma.InputJsonValue,
      },
    });

    return { snapshotId: snapshot.id, ...data };
  }

  private resolvePointsModel(config: Prisma.JsonValue): { win: number; draw: number; loss: number } {
    const fallback = { win: 2, draw: 0, loss: 0 };
    if (!config || typeof config !== 'object' || Array.isArray(config)) return fallback;

    const cfg = config as Record<string, unknown>;
    const pointsModel = cfg.points_model;
    if (!pointsModel || typeof pointsModel !== 'object' || Array.isArray(pointsModel)) return fallback;

    const model = pointsModel as Record<string, unknown>;
    const win = this.toNonNegativeInt(model.win ?? model.win_points ?? fallback.win);
    const draw = this.toNonNegativeInt(model.draw ?? model.draw_points ?? fallback.draw);
    const loss = this.toNonNegativeInt(model.loss ?? model.loss_points ?? fallback.loss);
    return { win, draw, loss };
  }

  private toNonNegativeInt(value: unknown): number {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) return 0;
    const floored = Math.floor(n);
    return floored < 0 ? 0 : floored;
  }
}
