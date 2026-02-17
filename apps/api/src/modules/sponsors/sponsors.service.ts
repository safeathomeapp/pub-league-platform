import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SponsorScopeType } from '@prisma/client';
import { PrismaService } from '../db/prisma.service';

@Injectable()
export class SponsorsService {
  constructor(private prisma: PrismaService) {}

  async list(orgId: string, query?: { scopeType?: SponsorScopeType; scopeId?: string }) {
    const now = new Date();
    return this.prisma.sponsorSlot.findMany({
      where: {
        organisationId: orgId,
        ...(query?.scopeType ? { scopeType: query.scopeType } : {}),
        ...(query?.scopeId ? { scopeId: query.scopeId } : {}),
        OR: [{ startAt: null }, { startAt: { lte: now } }],
        AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async create(
    orgId: string,
    dto: {
      scopeType: SponsorScopeType;
      scopeId?: string;
      title?: string;
      imageUrl: string;
      linkUrl?: string;
      startAt?: string;
      endAt?: string;
      sortOrder?: number;
    },
  ) {
    await this.assertValidScope(orgId, dto.scopeType, dto.scopeId);
    const startAt = dto.startAt ? new Date(dto.startAt) : null;
    const endAt = dto.endAt ? new Date(dto.endAt) : null;
    if (startAt && endAt && startAt > endAt) {
      throw new BadRequestException('startAt must be before or equal to endAt');
    }

    return this.prisma.sponsorSlot.create({
      data: {
        organisationId: orgId,
        scopeType: dto.scopeType,
        scopeId: dto.scopeType === SponsorScopeType.ORG ? null : dto.scopeId!,
        title: dto.title ?? null,
        imageUrl: dto.imageUrl,
        linkUrl: dto.linkUrl ?? null,
        startAt,
        endAt,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async update(
    orgId: string,
    sponsorId: string,
    dto: {
      scopeType?: SponsorScopeType;
      scopeId?: string;
      title?: string;
      imageUrl?: string;
      linkUrl?: string;
      startAt?: string;
      endAt?: string;
      sortOrder?: number;
    },
  ) {
    const existing = await this.prisma.sponsorSlot.findFirst({
      where: { id: sponsorId, organisationId: orgId },
      select: { id: true, scopeType: true, scopeId: true, startAt: true, endAt: true },
    });
    if (!existing) throw new NotFoundException('Sponsor slot not found');

    const nextScopeType = dto.scopeType ?? existing.scopeType;
    const nextScopeId = dto.scopeType === SponsorScopeType.ORG ? null : (dto.scopeId ?? existing.scopeId ?? undefined);
    await this.assertValidScope(orgId, nextScopeType, nextScopeId ?? undefined);

    const startAt = dto.startAt !== undefined ? (dto.startAt ? new Date(dto.startAt) : null) : existing.startAt;
    const endAt = dto.endAt !== undefined ? (dto.endAt ? new Date(dto.endAt) : null) : existing.endAt;
    if (startAt && endAt && startAt > endAt) {
      throw new BadRequestException('startAt must be before or equal to endAt');
    }

    return this.prisma.sponsorSlot.update({
      where: { id: sponsorId },
      data: {
        ...(dto.scopeType !== undefined ? { scopeType: dto.scopeType } : {}),
        ...(dto.scopeType !== undefined || dto.scopeId !== undefined
          ? { scopeId: nextScopeType === SponsorScopeType.ORG ? null : (nextScopeId ?? null) }
          : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
        ...(dto.linkUrl !== undefined ? { linkUrl: dto.linkUrl } : {}),
        ...(dto.startAt !== undefined ? { startAt } : {}),
        ...(dto.endAt !== undefined ? { endAt } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });
  }

  async remove(orgId: string, sponsorId: string) {
    const existing = await this.prisma.sponsorSlot.findFirst({
      where: { id: sponsorId, organisationId: orgId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Sponsor slot not found');
    await this.prisma.sponsorSlot.delete({ where: { id: sponsorId } });
    return { deleted: true };
  }

  private async assertValidScope(orgId: string, scopeType: SponsorScopeType, scopeId?: string) {
    if (scopeType === SponsorScopeType.ORG) {
      if (scopeId) throw new BadRequestException('scopeId must be omitted for ORG scope');
      return;
    }

    if (!scopeId) throw new BadRequestException('scopeId is required for LEAGUE and DIVISION scope');

    if (scopeType === SponsorScopeType.LEAGUE) {
      const league = await this.prisma.league.findFirst({
        where: { id: scopeId, organisationId: orgId },
        select: { id: true },
      });
      if (!league) throw new BadRequestException('scopeId league is not in this organisation');
      return;
    }

    const division = await this.prisma.division.findFirst({
      where: { id: scopeId, season: { league: { organisationId: orgId } } },
      select: { id: true },
    });
    if (!division) throw new BadRequestException('scopeId division is not in this organisation');
  }
}
