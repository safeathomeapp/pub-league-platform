import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';

@Injectable()
export class OrgsService {
  constructor(private prisma: PrismaService) {}

  async createOrg(userId: string, name: string) {
    const org = await this.prisma.organisation.create({ data: { name } });
    await this.prisma.orgMembership.create({
      data: { organisationId: org.id, userId, role: 'ORG_ADMIN' as any },
    });
    return org;
  }

  async listForUser(userId: string) {
    const memberships = await this.prisma.orgMembership.findMany({
      where: { userId },
      include: { organisation: true },
      orderBy: { createdAt: 'desc' },
    });
    return memberships.map(m => ({ ...m.organisation, role: m.role }));
  }

  async get(orgId: string) {
    const org = await this.prisma.organisation.findUnique({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organisation not found');
    return org;
  }

  async update(orgId: string, name: string) {
    return this.prisma.organisation.update({ where: { id: orgId }, data: { name } });
  }
}
