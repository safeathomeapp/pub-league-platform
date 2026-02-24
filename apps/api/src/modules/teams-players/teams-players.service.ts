import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { FixtureState } from '@prisma/client';
import { PrismaService } from '../db/prisma.service';

@Injectable()
export class TeamsPlayersService {
  constructor(private prisma: PrismaService) {}

  async createTeam(orgId: string, divisionId: string, name: string) {
    await this.assertDivisionInOrg(orgId, divisionId);
    return this.prisma.team.create({ data: { divisionId, name } });
  }

  async listTeams(orgId: string, divisionId: string) {
    const division = await this.prisma.division.findFirst({
      where: {
        id: divisionId,
        season: { league: { organisationId: orgId } },
      },
      select: { id: true, seasonId: true },
    });
    if (!division) throw new NotFoundException('Division not found');

    await this.applyDueTransfersForSeason(orgId, division.seasonId);

    return this.prisma.team.findMany({
      where: { divisionId },
      include: { roster: { include: { player: true }, orderBy: { joinedAt: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  }

  async updateTeam(orgId: string, teamId: string, name: string) {
    await this.assertTeamInOrg(orgId, teamId);
    return this.prisma.team.update({ where: { id: teamId }, data: { name } });
  }

  async createPlayer(
    orgId: string,
    data: { displayName: string; contactEmail?: string; contactPhone?: string },
  ) {
    return this.prisma.player.create({
      data: {
        organisationId: orgId,
        displayName: data.displayName,
        contactEmail: data.contactEmail ?? null,
        contactPhone: data.contactPhone ?? null,
      },
    });
  }

  async listPlayers(orgId: string) {
    return this.prisma.player.findMany({
      where: { organisationId: orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updatePlayer(
    orgId: string,
    playerId: string,
    data: { displayName?: string; contactEmail?: string; contactPhone?: string },
  ) {
    const player = await this.prisma.player.findFirst({
      where: { id: playerId, organisationId: orgId },
      select: { id: true },
    });
    if (!player) throw new NotFoundException('Player not found');

    // Explicitly map optional patch fields to keep update behavior predictable.
    return this.prisma.player.update({
      where: { id: playerId },
      data: {
        ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
        ...(data.contactEmail !== undefined ? { contactEmail: data.contactEmail } : {}),
        ...(data.contactPhone !== undefined ? { contactPhone: data.contactPhone } : {}),
      },
    });
  }

  async addTeamPlayer(orgId: string, teamId: string, playerId: string, role: string) {
    const team = await this.prisma.team.findFirst({
      where: {
        id: teamId,
        division: { season: { league: { organisationId: orgId } } },
      },
      select: { id: true, division: { select: { seasonId: true } } },
    });
    if (!team) throw new NotFoundException('Team not found');
    await this.applyDueTransfersForSeason(orgId, team.division.seasonId);

    const player = await this.prisma.player.findFirst({
      where: { id: playerId, organisationId: orgId },
      select: { id: true },
    });
    if (!player) throw new NotFoundException('Player not found');

    try {
      return await this.prisma.teamPlayer.create({
        data: { teamId, seasonId: team.division.seasonId, playerId, role: role as any },
        include: { player: true, team: true },
      });
    } catch {
      throw new ConflictException('Player already in team roster for this season');
    }
  }

  async removeTeamPlayer(orgId: string, teamId: string, playerId: string) {
    const team = await this.prisma.team.findFirst({
      where: {
        id: teamId,
        division: { season: { league: { organisationId: orgId } } },
      },
      select: { id: true, division: { select: { seasonId: true } } },
    });
    if (!team) throw new NotFoundException('Team not found');
    await this.applyDueTransfersForSeason(orgId, team.division.seasonId);

    const player = await this.prisma.player.findFirst({
      where: { id: playerId, organisationId: orgId },
      select: { id: true },
    });
    if (!player) throw new NotFoundException('Player not found');

    const existing = await this.prisma.teamPlayer.findUnique({
      where: { teamId_playerId: { teamId, playerId } },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Roster entry not found');

    const appearances = await this.countLockedAppearances(team.division.seasonId, teamId);
    const seasonPolicy = await this.prisma.season.findFirst({
      where: {
        id: team.division.seasonId,
        league: { organisationId: orgId },
      },
      select: {
        rosterLockAfterAppearances: true,
      },
    });
    if (seasonPolicy && appearances >= seasonPolicy.rosterLockAfterAppearances) {
      throw new ForbiddenException('Player is roster-locked for this season');
    }

    await this.prisma.teamPlayer.delete({
      where: { teamId_playerId: { teamId, playerId } },
    });
    return { removed: true };
  }

  async transferSeasonPlayer(
    orgId: string,
    seasonId: string,
    playerId: string,
    toTeamId: string,
    effectiveFromInput: string,
    actorUserId: string,
    actorRole: string | undefined,
    reason: string,
  ) {
    await this.applyDueTransfersForSeason(orgId, seasonId);
    const effectiveFrom = new Date(effectiveFromInput);
    if (Number.isNaN(effectiveFrom.getTime())) {
      throw new BadRequestException('Invalid effectiveFrom');
    }

    const currentRoster = await this.prisma.teamPlayer.findFirst({
      where: {
        seasonId,
        playerId,
        team: { division: { season: { league: { organisationId: orgId } } } },
      },
      select: { id: true, teamId: true, seasonId: true },
    });
    if (!currentRoster) throw new NotFoundException('Player is not currently rostered in this season');
    if (currentRoster.teamId === toTeamId) throw new BadRequestException('Player is already in that team');

    const decision = await this.canMovePlayer({
      orgId,
      seasonId,
      playerId,
      fromTeamId: currentRoster.teamId,
      toTeamId,
      actorUserId,
      actorRole,
      reason,
    });

    const now = new Date();
    const applyNow = effectiveFrom <= now;

    const updated = await this.prisma.$transaction(async tx => {
      const audit = await tx.rosterTransferAudit.create({
        data: {
          organisationId: orgId,
          seasonId,
          playerId,
          fromTeamId: currentRoster.teamId,
          toTeamId,
          effectiveFrom,
          appliedAt: applyNow ? now : null,
          actorUserId,
          reason,
          wasAdminOverride: decision.wasAdminOverride,
        },
      });

      if (!applyNow) {
        return {
          pending: true,
          transferId: audit.id,
          seasonId,
          playerId,
          fromTeamId: currentRoster.teamId,
          toTeamId,
          effectiveFrom: audit.effectiveFrom,
        };
      }

      return tx.teamPlayer.update({
        where: { id: currentRoster.id },
        data: { teamId: toTeamId },
        include: { player: true, team: true },
      });
    });

    return updated;
  }

  async listSeasonTransfers(
    orgId: string,
    seasonId: string,
    query: { playerId?: string; teamId?: string; from?: string; to?: string },
  ) {
    await this.assertSeasonInOrg(orgId, seasonId);
    await this.applyDueTransfersForSeason(orgId, seasonId);

    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    if (from && Number.isNaN(from.getTime())) throw new BadRequestException('Invalid from');
    if (to && Number.isNaN(to.getTime())) throw new BadRequestException('Invalid to');

    return this.prisma.rosterTransferAudit.findMany({
      where: {
        organisationId: orgId,
        seasonId,
        ...(query.playerId ? { playerId: query.playerId } : {}),
        ...(query.teamId ? { OR: [{ fromTeamId: query.teamId }, { toTeamId: query.teamId }] } : {}),
        ...(from || to
          ? {
              effectiveFrom: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      orderBy: [{ effectiveFrom: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async canMovePlayer(input: {
    orgId: string;
    seasonId: string;
    playerId: string;
    fromTeamId: string;
    toTeamId: string;
    actorUserId: string;
    actorRole: string | undefined;
    reason?: string;
  }): Promise<{ allowed: true; wasAdminOverride: boolean }> {
    const season = await this.prisma.season.findFirst({
      where: {
        id: input.seasonId,
        league: { organisationId: input.orgId },
      },
      select: {
        id: true,
        rosterLockAfterAppearances: true,
        allowMidSeasonTransfers: true,
        requireAdminApprovalForTransfer: true,
      },
    });
    if (!season) throw new NotFoundException('Season not found');

    const [fromTeam, toTeam, player] = await Promise.all([
      this.prisma.team.findFirst({
        where: {
          id: input.fromTeamId,
          division: { seasonId: input.seasonId, season: { league: { organisationId: input.orgId } } },
        },
        select: { id: true },
      }),
      this.prisma.team.findFirst({
        where: {
          id: input.toTeamId,
          division: { seasonId: input.seasonId, season: { league: { organisationId: input.orgId } } },
        },
        select: { id: true },
      }),
      this.prisma.player.findFirst({
        where: { id: input.playerId, organisationId: input.orgId },
        select: { id: true },
      }),
    ]);
    if (!fromTeam) throw new NotFoundException('Current team not found in this season');
    if (!toTeam) throw new NotFoundException('Destination team not found in this season');
    if (!player) throw new NotFoundException('Player not found');

    const appearances = await this.countLockedAppearances(input.seasonId, input.fromTeamId);
    const requiresOverride = !season.allowMidSeasonTransfers || appearances >= season.rosterLockAfterAppearances;

    if (requiresOverride) {
      const isAdmin = input.actorRole === 'ORG_ADMIN' || input.actorRole === 'COMMISSIONER';
      if (!isAdmin) throw new ForbiddenException('Admin override required for this transfer');
      if (season.requireAdminApprovalForTransfer && !input.reason?.trim()) {
        throw new BadRequestException('Admin override reason is required');
      }
      return { allowed: true, wasAdminOverride: true };
    }

    return { allowed: true, wasAdminOverride: false };
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

  private async assertTeamInOrg(orgId: string, teamId: string): Promise<void> {
    const team = await this.prisma.team.findFirst({
      where: {
        id: teamId,
        division: { season: { league: { organisationId: orgId } } },
      },
      select: { id: true },
    });
    if (!team) throw new NotFoundException('Team not found');
  }

  private async assertSeasonInOrg(orgId: string, seasonId: string): Promise<void> {
    const season = await this.prisma.season.findFirst({
      where: {
        id: seasonId,
        league: { organisationId: orgId },
      },
      select: { id: true },
    });
    if (!season) throw new NotFoundException('Season not found');
  }

  private async applyDueTransfersForSeason(orgId: string, seasonId: string): Promise<void> {
    const now = new Date();
    const dueTransfers = await this.prisma.rosterTransferAudit.findMany({
      where: {
        organisationId: orgId,
        seasonId,
        appliedAt: null,
        effectiveFrom: { lte: now },
      },
      orderBy: [{ effectiveFrom: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        playerId: true,
        fromTeamId: true,
        toTeamId: true,
      },
    });

    for (const transfer of dueTransfers) {
      await this.prisma.$transaction(async tx => {
        const roster = await tx.teamPlayer.findFirst({
          where: {
            seasonId,
            playerId: transfer.playerId,
            team: { division: { season: { league: { organisationId: orgId } } } },
          },
          select: { id: true, teamId: true },
        });

        if (roster && roster.teamId === transfer.fromTeamId) {
          await tx.teamPlayer.update({
            where: { id: roster.id },
            data: { teamId: transfer.toTeamId },
          });
        }

        await tx.rosterTransferAudit.update({
          where: { id: transfer.id },
          data: { appliedAt: now },
        });
      });
    }
  }

  private async countLockedAppearances(seasonId: string, teamId: string): Promise<number> {
    return this.prisma.fixture.count({
      where: {
        division: { seasonId },
        state: FixtureState.LOCKED,
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      },
    });
  }
}
