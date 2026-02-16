import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgMembershipGuard } from '../../common/guards/org-membership.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { MembershipsService } from './memberships.service';

@Controller('orgs/:orgId/members')
@UseGuards(JwtAuthGuard, OrgMembershipGuard, RolesGuard)
export class MembershipsController {
  constructor(private memberships: MembershipsService) {}

  @Get()
  @Roles('ORG_ADMIN','COMMISSIONER')
  list(@Param('orgId') orgId: string) {
    return this.memberships.list(orgId);
  }

  @Post()
  @Roles('ORG_ADMIN')
  add(@Param('orgId') orgId: string, @Body() dto: AddMemberDto) {
    return this.memberships.add(orgId, dto.email.toLowerCase(), dto.role);
  }

  @Patch(':memberId')
  @Roles('ORG_ADMIN')
  patch(@Param('orgId') orgId: string, @Param('memberId') memberId: string, @Body() dto: UpdateMemberRoleDto) {
    return this.memberships.updateRole(orgId, memberId, dto.role);
  }
}
