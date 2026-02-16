import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../db/prisma.service';

@Injectable()
export class RulesetsService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, name: string, sport: string, config: Prisma.InputJsonValue) {
    return this.prisma.ruleset.create({
      data: {
        organisationId: orgId,
        name,
        sport: sport as any,
        config,
      },
    });
  }

  async list(orgId: string) {
    return this.prisma.ruleset.findMany({
      where: { organisationId: orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(orgId: string, rulesetId: string) {
    const ruleset = await this.prisma.ruleset.findFirst({
      where: { id: rulesetId, organisationId: orgId },
    });
    if (!ruleset) throw new NotFoundException('Ruleset not found');
    return ruleset;
  }

  async update(
    orgId: string,
    rulesetId: string,
    data: { name?: string; sport?: string; config?: Prisma.InputJsonValue },
  ) {
    const existing = await this.prisma.ruleset.findFirst({
      where: { id: rulesetId, organisationId: orgId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Ruleset not found');

    // Keep patch semantics explicit to avoid overwriting fields with undefined.
    return this.prisma.ruleset.update({
      where: { id: rulesetId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.sport !== undefined ? { sport: data.sport as any } : {}),
        ...(data.config !== undefined ? { config: data.config } : {}),
      },
    });
  }
}
