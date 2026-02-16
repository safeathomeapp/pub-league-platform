import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';

@Injectable()
export class TeamsPlayersService {
  constructor(private prisma: PrismaService) {}

  async createTeam(orgId: string, divisionId: string, name: string) {
    await this.assertDivisionInOrg(orgId, divisionId);
    return this.prisma.team.create({ data: { divisionId, name } });
  }

  async listTeams(orgId: string, divisionId: string) {
    await this.assertDivisionInOrg(orgId, divisionId);
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
    await this.assertTeamInOrg(orgId, teamId);
    const player = await this.prisma.player.findFirst({
      where: { id: playerId, organisationId: orgId },
      select: { id: true },
    });
    if (!player) throw new NotFoundException('Player not found');

    try {
      return await this.prisma.teamPlayer.create({
        data: { teamId, playerId, role: role as any },
        include: { player: true, team: true },
      });
    } catch {
      throw new ConflictException('Player already in team roster');
    }
  }

  async removeTeamPlayer(orgId: string, teamId: string, playerId: string) {
    await this.assertTeamInOrg(orgId, teamId);
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

    await this.prisma.teamPlayer.delete({
      where: { teamId_playerId: { teamId, playerId } },
    });
    return { removed: true };
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
}
