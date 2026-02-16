import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';

@Injectable()
export class MembershipsService {
  constructor(private prisma: PrismaService) {}

  async list(orgId: string) {
    return this.prisma.orgMembership.findMany({
      where: { organisationId: orgId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async add(orgId: string, email: string, role: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User must register first');

    try {
      return await this.prisma.orgMembership.create({
        data: { organisationId: orgId, userId: user.id, role: role as any },
        include: { user: true },
      });
    } catch {
      throw new ConflictException('Membership already exists');
    }
  }

  async updateRole(orgId: string, memberId: string, role: string) {
    const membership = await this.prisma.orgMembership.findUnique({ where: { id: memberId } });
    if (!membership || membership.organisationId != orgId) throw new NotFoundException('Member not found');
    return this.prisma.orgMembership.update({ where: { id: memberId }, data: { role: role as any }, include: { user: true } });
  }
}
