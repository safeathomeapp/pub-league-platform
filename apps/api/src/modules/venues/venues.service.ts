import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';

@Injectable()
export class VenuesService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, data: { name: string; poolTables?: number; dartsBoards?: number }) {
    return this.prisma.venue.create({
      data: {
        organisationId: orgId,
        name: data.name,
        poolTables: data.poolTables ?? 1,
        dartsBoards: data.dartsBoards ?? 1,
      },
    });
  }

  async list(orgId: string) {
    return this.prisma.venue.findMany({
      where: { organisationId: orgId },
      orderBy: [{ name: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async update(orgId: string, venueId: string, data: { name?: string; poolTables?: number; dartsBoards?: number }) {
    await this.assertVenueInOrg(orgId, venueId);
    return this.prisma.venue.update({
      where: { id: venueId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.poolTables !== undefined ? { poolTables: data.poolTables } : {}),
        ...(data.dartsBoards !== undefined ? { dartsBoards: data.dartsBoards } : {}),
      },
    });
  }

  private async assertVenueInOrg(orgId: string, venueId: string): Promise<void> {
    const venue = await this.prisma.venue.findFirst({
      where: { id: venueId, organisationId: orgId },
      select: { id: true },
    });
    if (!venue) throw new NotFoundException('Venue not found');
  }
}
