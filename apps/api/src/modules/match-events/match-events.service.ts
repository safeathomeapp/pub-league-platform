import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DisputeStatus, FixtureState, FixtureStatus, MatchEventType, Prisma } from '@prisma/client';
import { PrismaService } from '../db/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { StandingsService } from '../standings/standings.service';

@Injectable()
export class MatchEventsService {
  constructor(
    private prisma: PrismaService,
    private standings: StandingsService,
    private notifications: NotificationsService,
  ) {}

  async append(
    orgId: string,
    fixtureId: string,
    actorUserId: string,
    actorRole: string | undefined,
    data: {
      eventType: MatchEventType;
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
    data: {
      expectedRevision: number;
      homeFrames: number;
      awayFrames: number;
      reason: string;
    },
  ) {
    const fixture = await this.getFixtureInOrg(orgId, fixtureId);

    await this.prisma.$transaction(async tx => {
      const currentRevision = await this.getCurrentRevision(tx, fixtureId);
      if (data.expectedRevision !== currentRevision) {
        throw new ConflictException(`Revision mismatch: expected ${currentRevision}`);
      }

      let nextRevision = currentRevision + 1;
      await tx.matchEvent.create({
        data: {
          fixtureId,
          revision: nextRevision,
          eventType: MatchEventType.MATCH_COMPLETED,
          actorUserId,
          payload: { home_frames: data.homeFrames, away_frames: data.awayFrames } as Prisma.InputJsonValue,
        },
      });
      nextRevision += 1;

      await tx.matchEvent.create({
        data: {
          fixtureId,
          revision: nextRevision,
          eventType: MatchEventType.ADMIN_LOCK_OVERRIDE,
          actorUserId,
          payload: { reason: data.reason } as Prisma.InputJsonValue,
        },
      });

      await tx.fixture.update({
        where: { id: fixtureId },
        data: { status: FixtureStatus.completed, state: FixtureState.LOCKED },
      });
    });

    // Keep snapshots warm immediately after match completion.
    await this.standings.recomputeAndSnapshot(orgId, fixture.divisionId);

    await this.notifications.queueFixtureCompleted(orgId, fixtureId, data.homeFrames, data.awayFrames);

    return this.prisma.fixture.findUnique({ where: { id: fixtureId } });
  }

  async submit(
    orgId: string,
    fixtureId: string,
    actorUserId: string,
    data: {
      expectedRevision: number;
      homeFrames: number;
      awayFrames: number;
      teamId?: string;
      actorPlayerId?: string;
    },
  ) {
    const fixture = await this.getFixtureInOrg(orgId, fixtureId);
    if (fixture.state !== FixtureState.SCHEDULED && fixture.state !== FixtureState.IN_PROGRESS) {
      throw new ConflictException('Fixture cannot be submitted from current state');
    }

    if (!data.teamId || !data.actorPlayerId) {
      throw new ForbiddenException('Token-holder submit requires teamId and actorPlayerId');
    }
    this.assertTeamOnFixture(fixture, data.teamId);
    await this.assertTokenHolder(orgId, fixtureId, data.teamId, data.actorPlayerId);

    const updated = await this.prisma.$transaction(async tx => {
      const currentRevision = await this.getCurrentRevision(tx, fixtureId);
      if (data.expectedRevision !== currentRevision) {
        throw new ConflictException(`Revision mismatch: expected ${currentRevision}`);
      }

      let nextRevision = currentRevision + 1;
      await tx.matchEvent.create({
        data: {
          fixtureId,
          revision: nextRevision,
          eventType: MatchEventType.RESULT_SUBMITTED,
          actorUserId,
          payload: {
            submitting_team_id: data.teamId,
            home_frames: data.homeFrames,
            away_frames: data.awayFrames,
          } as Prisma.InputJsonValue,
        },
      });
      nextRevision += 1;

      await tx.matchEvent.create({
        data: {
          fixtureId,
          revision: nextRevision,
          eventType: MatchEventType.OPPONENT_REVIEW_REQUESTED,
          actorUserId,
          payload: {
            submitting_team_id: data.teamId,
          } as Prisma.InputJsonValue,
        },
      });

      return tx.fixture.update({
        where: { id: fixtureId },
        data: {
          state: FixtureState.AWAITING_OPPONENT,
          status: FixtureStatus.in_progress,
        },
      });
    });

    return updated;
  }

  async approve(
    orgId: string,
    fixtureId: string,
    actorUserId: string,
    data: {
      expectedRevision: number;
      teamId?: string;
      actorPlayerId?: string;
    },
  ) {
    const fixture = await this.getFixtureInOrg(orgId, fixtureId);
    if (fixture.state === FixtureState.LOCKED) throw new ConflictException('Fixture is already locked');
    if (fixture.state !== FixtureState.AWAITING_OPPONENT) {
      throw new ConflictException('Fixture is not awaiting opponent approval');
    }

    if (!data.teamId || !data.actorPlayerId) {
      throw new ForbiddenException('Token-holder approval requires teamId and actorPlayerId');
    }
    this.assertTeamOnFixture(fixture, data.teamId);
    await this.assertTokenHolder(orgId, fixtureId, data.teamId, data.actorPlayerId);

    const payload = await this.getLatestSubmittedPayload(fixtureId);
    if (payload.submittingTeamId === data.teamId) {
      throw new ForbiddenException('Submitting team cannot approve its own result');
    }

    const updated = await this.prisma.$transaction(async tx => {
      const currentRevision = await this.getCurrentRevision(tx, fixtureId);
      if (data.expectedRevision !== currentRevision) {
        throw new ConflictException(`Revision mismatch: expected ${currentRevision}`);
      }

      let nextRevision = currentRevision + 1;
      await tx.matchEvent.create({
        data: {
          fixtureId,
          revision: nextRevision,
          eventType: MatchEventType.RESULT_APPROVED,
          actorUserId,
          payload: {
            submitting_team_id: payload.submittingTeamId,
            approving_team_id: data.teamId,
          } as Prisma.InputJsonValue,
        },
      });
      nextRevision += 1;

      await tx.matchEvent.create({
        data: {
          fixtureId,
          revision: nextRevision,
          eventType: MatchEventType.MATCH_COMPLETED,
          actorUserId,
          payload: {
            home_frames: payload.homeFrames,
            away_frames: payload.awayFrames,
          } as Prisma.InputJsonValue,
        },
      });

      return tx.fixture.update({
        where: { id: fixtureId },
        data: {
          state: FixtureState.LOCKED,
          status: FixtureStatus.completed,
        },
      });
    });

    await this.standings.recomputeAndSnapshot(orgId, fixture.divisionId);
    await this.notifications.queueFixtureCompleted(orgId, fixtureId, payload.homeFrames, payload.awayFrames);

    return updated;
  }

  async reject(
    orgId: string,
    fixtureId: string,
    actorUserId: string,
    data: {
      expectedRevision: number;
      teamId?: string;
      actorPlayerId?: string;
      reason?: string;
    },
  ) {
    const fixture = await this.getFixtureInOrg(orgId, fixtureId);
    if (fixture.state === FixtureState.LOCKED) throw new ConflictException('Fixture is already locked');
    if (fixture.state !== FixtureState.AWAITING_OPPONENT) {
      throw new ConflictException('Fixture is not awaiting opponent approval');
    }

    if (!data.teamId || !data.actorPlayerId) {
      throw new ForbiddenException('Token-holder rejection requires teamId and actorPlayerId');
    }
    this.assertTeamOnFixture(fixture, data.teamId);
    await this.assertTokenHolder(orgId, fixtureId, data.teamId, data.actorPlayerId);

    const payload = await this.getLatestSubmittedPayload(fixtureId);
    if (payload.submittingTeamId === data.teamId) {
      throw new ForbiddenException('Submitting team cannot reject its own submission');
    }

    const reason = data.reason?.trim() || 'Result rejected by opponent captain';

    return this.prisma.$transaction(async tx => {
      const currentRevision = await this.getCurrentRevision(tx, fixtureId);
      if (data.expectedRevision !== currentRevision) {
        throw new ConflictException(`Revision mismatch: expected ${currentRevision}`);
      }

      let nextRevision = currentRevision + 1;
      await tx.matchEvent.create({
        data: {
          fixtureId,
          revision: nextRevision,
          eventType: MatchEventType.RESULT_REJECTED,
          actorUserId,
          payload: {
            submitting_team_id: payload.submittingTeamId,
            rejecting_team_id: data.teamId,
            reason,
          } as Prisma.InputJsonValue,
        },
      });
      nextRevision += 1;

      const dispute = await tx.dispute.create({
        data: {
          fixtureId,
          status: DisputeStatus.open,
          reason,
        },
      });

      await tx.matchEvent.create({
        data: {
          fixtureId,
          revision: nextRevision,
          eventType: MatchEventType.DISPUTE_OPENED,
          actorUserId,
          payload: {
            dispute_id: dispute.id,
            reason,
          } as Prisma.InputJsonValue,
        },
      });

      return tx.fixture.update({
        where: { id: fixtureId },
        data: { state: FixtureState.DISPUTED, status: FixtureStatus.in_progress },
      });
    });
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

  private async getFixtureInOrg(orgId: string, fixtureId: string) {
    const fixture = await this.prisma.fixture.findFirst({
      where: {
        id: fixtureId,
        division: { season: { league: { organisationId: orgId } } },
      },
      select: { id: true, divisionId: true, homeTeamId: true, awayTeamId: true, state: true },
    });
    if (!fixture) throw new NotFoundException('Fixture not found');
    return fixture;
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

  private assertTeamOnFixture(
    fixture: { homeTeamId: string; awayTeamId: string },
    teamId: string,
  ): void {
    if (fixture.homeTeamId !== teamId && fixture.awayTeamId !== teamId) {
      throw new NotFoundException('Team not on fixture');
    }
  }

  private async assertTokenHolder(
    orgId: string,
    fixtureId: string,
    teamId: string,
    actorPlayerId: string,
  ): Promise<void> {
    const player = await this.prisma.player.findFirst({
      where: { id: actorPlayerId, organisationId: orgId },
      select: { id: true },
    });
    if (!player) throw new NotFoundException('Player not found');

    const rosterEntry = await this.prisma.teamPlayer.findUnique({
      where: { teamId_playerId: { teamId, playerId: actorPlayerId } },
      select: { id: true },
    });
    if (!rosterEntry) throw new ForbiddenException('Player must belong to team roster');

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
    if (!activeAcceptedToken) throw new ForbiddenException('No accepted token for this player/team');
  }

  private async getCurrentRevision(tx: Prisma.TransactionClient, fixtureId: string): Promise<number> {
    const latest = await tx.matchEvent.findFirst({
      where: { fixtureId },
      orderBy: { revision: 'desc' },
      select: { revision: true },
    });
    return latest?.revision ?? 0;
  }

  private async getLatestSubmittedPayload(fixtureId: string): Promise<{
    submittingTeamId: string;
    homeFrames: number;
    awayFrames: number;
  }> {
    const submitted = await this.prisma.matchEvent.findFirst({
      where: { fixtureId, eventType: MatchEventType.RESULT_SUBMITTED },
      orderBy: { revision: 'desc' },
      select: { payload: true },
    });
    if (!submitted) throw new ConflictException('No submitted result to review');

    const payload = submitted.payload as Record<string, unknown>;
    const submittingTeamId = typeof payload.submitting_team_id === 'string' ? payload.submitting_team_id : '';
    if (!submittingTeamId) throw new ConflictException('Submitted result payload missing submitting team');

    return {
      submittingTeamId,
      homeFrames: this.toNonNegativeInt(payload.home_frames),
      awayFrames: this.toNonNegativeInt(payload.away_frames),
    };
  }

  private toNonNegativeInt(value: unknown): number {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) return 0;
    const floored = Math.floor(n);
    return floored < 0 ? 0 : floored;
  }
}
