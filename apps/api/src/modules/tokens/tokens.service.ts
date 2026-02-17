import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MatchEventType, Prisma } from '@prisma/client';
import { PrismaService } from '../db/prisma.service';

@Injectable()
export class TokensService {
  constructor(private prisma: PrismaService) {}

  async issue(
    orgId: string,
    fixtureId: string,
    actorUserId: string,
    dto: { teamId: string; holderPlayerId: string },
  ) {
    await this.assertFixtureInOrg(orgId, fixtureId);
    await this.assertTeamOnFixture(fixtureId, dto.teamId);
    await this.assertPlayerInOrg(orgId, dto.holderPlayerId);
    await this.assertPlayerOnTeam(dto.teamId, dto.holderPlayerId);

    const active = await this.findActiveToken(fixtureId, dto.teamId);
    const now = new Date();
    return this.prisma.$transaction(async tx => {
      if (active) {
        await tx.matchControlToken.update({
          where: { id: active.id },
          data: { revokedAt: now },
        });
      }

      const created = await tx.matchControlToken.create({
        data: {
          fixtureId,
          teamId: dto.teamId,
          currentHolderPlayerId: dto.holderPlayerId,
          acceptedAt: now,
        },
      });

      await this.appendEvent(tx, fixtureId, actorUserId, MatchEventType.TOKEN_ISSUED, {
        team_id: dto.teamId,
        holder_player_id: dto.holderPlayerId,
      });

      return created;
    });
  }

  async transfer(
    orgId: string,
    fixtureId: string,
    actorUserId: string,
    dto: { teamId: string; toPlayerId: string },
  ) {
    await this.assertFixtureInOrg(orgId, fixtureId);
    await this.assertTeamOnFixture(fixtureId, dto.teamId);
    await this.assertPlayerInOrg(orgId, dto.toPlayerId);
    await this.assertPlayerOnTeam(dto.teamId, dto.toPlayerId);

    const token = await this.findActiveToken(fixtureId, dto.teamId);
    if (!token) throw new NotFoundException('Active token not found');

    const fromPlayerId = token.currentHolderPlayerId;
    if (fromPlayerId === dto.toPlayerId) throw new BadRequestException('Token is already assigned to this player');

    return this.prisma.$transaction(async tx => {
      const updated = await tx.matchControlToken.update({
        where: { id: token.id },
        data: {
          currentHolderPlayerId: dto.toPlayerId,
          acceptedAt: null,
        },
      });

      await this.appendEvent(tx, fixtureId, actorUserId, MatchEventType.TOKEN_TRANSFERRED, {
        team_id: dto.teamId,
        from_player_id: fromPlayerId,
        to_player_id: dto.toPlayerId,
      });

      return updated;
    });
  }

  async accept(
    orgId: string,
    fixtureId: string,
    actorUserId: string,
    dto: { teamId: string; playerId: string },
  ) {
    await this.assertFixtureInOrg(orgId, fixtureId);
    await this.assertTeamOnFixture(fixtureId, dto.teamId);
    await this.assertPlayerInOrg(orgId, dto.playerId);
    await this.assertPlayerOnTeam(dto.teamId, dto.playerId);

    const token = await this.findActiveToken(fixtureId, dto.teamId);
    if (!token) throw new NotFoundException('Active token not found');
    if (token.currentHolderPlayerId !== dto.playerId) throw new ForbiddenException('Only the recipient can accept');
    if (token.acceptedAt) throw new BadRequestException('Token is already accepted');

    return this.prisma.$transaction(async tx => {
      const updated = await tx.matchControlToken.update({
        where: { id: token.id },
        data: { acceptedAt: new Date() },
      });

      await this.appendEvent(tx, fixtureId, actorUserId, MatchEventType.TOKEN_ACCEPTED, {
        team_id: dto.teamId,
        player_id: dto.playerId,
      });

      return updated;
    });
  }

  async list(orgId: string, fixtureId: string) {
    await this.assertFixtureInOrg(orgId, fixtureId);
    return this.prisma.matchControlToken.findMany({
      where: { fixtureId },
      orderBy: [{ revokedAt: 'asc' }, { issuedAt: 'desc' }],
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

  private async assertTeamOnFixture(fixtureId: string, teamId: string): Promise<void> {
    const fixture = await this.prisma.fixture.findFirst({
      where: {
        id: fixtureId,
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      },
      select: { id: true },
    });
    if (!fixture) throw new NotFoundException('Team not on fixture');
  }

  private async assertPlayerInOrg(orgId: string, playerId: string): Promise<void> {
    const player = await this.prisma.player.findFirst({
      where: { id: playerId, organisationId: orgId },
      select: { id: true },
    });
    if (!player) throw new NotFoundException('Player not found');
  }

  private async assertPlayerOnTeam(teamId: string, playerId: string): Promise<void> {
    const rosterEntry = await this.prisma.teamPlayer.findUnique({
      where: { teamId_playerId: { teamId, playerId } },
      select: { id: true },
    });
    if (!rosterEntry) throw new ForbiddenException('Player must belong to team roster');
  }

  private async findActiveToken(fixtureId: string, teamId: string) {
    return this.prisma.matchControlToken.findFirst({
      where: {
        fixtureId,
        teamId,
        revokedAt: null,
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  private async appendEvent(
    tx: Prisma.TransactionClient,
    fixtureId: string,
    actorUserId: string,
    eventType: MatchEventType,
    payload: Prisma.InputJsonValue,
  ) {
    const latest = await tx.matchEvent.findFirst({
      where: { fixtureId },
      orderBy: { revision: 'desc' },
      select: { revision: true },
    });
    const nextRevision = (latest?.revision ?? 0) + 1;

    // Event ledger remains append-only; every token action is auditable.
    await tx.matchEvent.create({
      data: {
        fixtureId,
        revision: nextRevision,
        eventType,
        actorUserId,
        payload: payload as Prisma.InputJsonValue,
      },
    });
  }
}
