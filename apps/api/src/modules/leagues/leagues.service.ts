import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';

@Injectable()
export class LeaguesService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, name: string, sport: string, rulesetId: string) {
    const ruleset = await this.prisma.ruleset.findFirst({
      where: { id: rulesetId, organisationId: orgId },
      select: { id: true, sport: true },
    });
    if (!ruleset) throw new NotFoundException('Ruleset not found');
    if (ruleset.sport !== sport) throw new BadRequestException('League sport must match ruleset sport');

    return this.prisma.league.create({
      data: {
        organisationId: orgId,
        name,
        sport: sport as any,
        rulesetId,
      },
    });
  }

  async list(orgId: string) {
    return this.prisma.league.findMany({
      where: { organisationId: orgId },
      include: { ruleset: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(orgId: string, leagueId: string) {
    const league = await this.prisma.league.findFirst({
      where: { id: leagueId, organisationId: orgId },
      include: { ruleset: true },
    });
    if (!league) throw new NotFoundException('League not found');
    return league;
  }

  async update(
    orgId: string,
    leagueId: string,
    data: { name?: string; sport?: string; rulesetId?: string },
  ) {
    const league = await this.prisma.league.findFirst({
      where: { id: leagueId, organisationId: orgId },
      select: { id: true, sport: true, rulesetId: true },
    });
    if (!league) throw new NotFoundException('League not found');

    const nextSport = data.sport ?? league.sport;
    const nextRulesetId = data.rulesetId ?? league.rulesetId;

    const ruleset = await this.prisma.ruleset.findFirst({
      where: { id: nextRulesetId, organisationId: orgId },
      select: { id: true, sport: true },
    });
    if (!ruleset) throw new NotFoundException('Ruleset not found');
    // Invariant: league and ruleset sports must stay aligned on every update.
    if (ruleset.sport !== nextSport) throw new BadRequestException('League sport must match ruleset sport');

    return this.prisma.league.update({
      where: { id: leagueId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.sport !== undefined ? { sport: data.sport as any } : {}),
        ...(data.rulesetId !== undefined ? { rulesetId: data.rulesetId } : {}),
      },
      include: { ruleset: true },
    });
  }
}
