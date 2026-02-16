import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../modules/db/prisma.service';

@Injectable()
export class OrgMembershipGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<any>();
    const userId: string | undefined = req.user?.id;
    const orgId: string | undefined = req.params?.orgId;

    if (!userId) throw new ForbiddenException('Not authenticated');
    if (!orgId) throw new ForbiddenException('Organisation context missing');

    const membership = await this.prisma.orgMembership.findUnique({
      where: { organisationId_userId: { organisationId: orgId, userId } },
    });

    if (!membership) throw new ForbiddenException('Not a member of this organisation');

    req.ctx = {
      userId,
      email: req.user?.email,
      organisationId: orgId,
      role: membership.role,
      membershipId: membership.id,
    };

    return true;
  }
}
