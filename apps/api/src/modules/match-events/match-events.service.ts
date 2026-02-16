import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../db/prisma.service';
import { StandingsService } from '../standings/standings.service';

@Injectable()
export class MatchEventsService {
  constructor(
    private prisma: PrismaService,
    private standings: StandingsService,
  ) {}

  async append(
    orgId: string,
    fixtureId: string,
    actorUserId: string,
    actorRole: string | undefined,
    data: {
      eventType: string;
      expectedRevision: number;
      payload: Record<string, unknown>;
      teamId?: string;
      actorPlayerId?: string;
    },
  ) {
    await this.assertFixtureInOrg(orgId, fixtureId);
    await this.assertCanWrite(orgId, fixtureId, actorRole, data.teamId, data.actorPlayerId);

    return this.prisma.$transaction(async tx => {
      const latest = await tx.matchEvent.findFirst({
        where: { fixtureId },
        orderBy: { revision: 'desc' },
        select: { revision: true },
      });
      const currentRevision = latest?.revision ?? 0;
      if (data.expectedRevision !== currentRevision) {
        throw new ConflictException(`Revision mismatch: expected ${currentRevision}`);
      }

      return tx.matchEvent.create({
        data: {
          fixtureId,
          revision: currentRevision + 1,
          eventType: data.eventType,
          actorUserId,
          payload: data.payload as Prisma.InputJsonValue,
        },
      });
    });
  }

  async list(orgId: string, fixtureId: string) {
    await this.assertFixtureInOrg(orgId, fixtureId);
    return this.prisma.matchEvent.findMany({
      where: { fixtureId },
      orderBy: { revision: 'asc' },
    });
  }

  async complete(
    orgId: string,
    fixtureId: string,
    actorUserId: string,
    actorRole: string | undefined,
    data: {
      expectedRevision: number;
      homeFrames: number;
      awayFrames: number;
      teamId?: string;
      actorPlayerId?: string;
    },
  ) {
    const event = await this.append(orgId, fixtureId, actorUserId, actorRole, {
      eventType: 'MATCH_COMPLETED',
      expectedRevision: data.expectedRevision,
      payload: { home_frames: data.homeFrames, away_frames: data.awayFrames },
      teamId: data.teamId,
      actorPlayerId: data.actorPlayerId,
    });

    await this.prisma.fixture.update({
      where: { id: fixtureId },
      data: { status: 'completed' },
    });

    const fixture = await this.prisma.fixture.findUnique({
      where: { id: fixtureId },
      select: { divisionId: true },
    });
    if (fixture) {
      // Keep snapshots warm immediately after match completion.
      await this.standings.recomputeAndSnapshot(orgId, fixture.divisionId);
    }

    return event;
  }

  private async assertFixtureInOrg(orgId: string, fixtureId: string): Promise<void> {
    const fixture = await this.prisma.fixture.findFirst({
      where: {
        id: fixtureId,
        division: { season: { league: { organisationId: orgId } } },
      },
      select: { id: true },
    });
    if (!fixture) throw new NotFoundException('Fixture not found');
  }

  private async assertCanWrite(
    orgId: string,
    fixtureId: string,
    actorRole: string | undefined,
    teamId?: string,
    actorPlayerId?: string,
  ): Promise<void> {
    if (actorRole === 'ORG_ADMIN' || actorRole === 'COMMISSIONER' || actorRole === 'CAPTAIN') return;

    if (!teamId || !actorPlayerId) {
      throw new ForbiddenException('Token-holder writes require teamId and actorPlayerId');
    }

    const fixtureTeam = await this.prisma.fixture.findFirst({
      where: {
        id: fixtureId,
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      },
      select: { id: true },
    });
    if (!fixtureTeam) throw new NotFoundException('Team not on fixture');

    const player = await this.prisma.player.findFirst({
      where: { id: actorPlayerId, organisationId: orgId },
      select: { id: true },
    });
    if (!player) throw new NotFoundException('Player not found');

    const activeAcceptedToken = await this.prisma.matchControlToken.findFirst({
      where: {
        fixtureId,
        teamId,
        currentHolderPlayerId: actorPlayerId,
        revokedAt: null,
        acceptedAt: { not: null },
      },
      select: { id: true },
    });
    // Without a user-player link, player-role writes are authorized by explicit token-holder player identity.
    if (!activeAcceptedToken) throw new ForbiddenException('No accepted token for this player/team');
  }
}
