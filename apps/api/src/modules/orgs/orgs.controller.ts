import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OrgMembershipGuard } from '../../common/guards/org-membership.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateOrgDto } from './dto/create-org.dto';
import { UpdateOrgDto } from './dto/update-org.dto';
import { OrgsService } from './orgs.service';

@Controller('orgs')
@UseGuards(JwtAuthGuard)
export class OrgsController {
  constructor(private orgs: OrgsService) {}

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateOrgDto) {
    return this.orgs.createOrg(user.id, dto.name);
  }

  @Get()
  list(@CurrentUser() user: { id: string }) {
    return this.orgs.listForUser(user.id);
  }

  @Get(':orgId')
  @UseGuards(OrgMembershipGuard)
  get(@Param('orgId') orgId: string) {
    return this.orgs.get(orgId);
  }

  @Patch(':orgId')
  @UseGuards(OrgMembershipGuard, RolesGuard)
  @Roles('ORG_ADMIN')
  patch(@Param('orgId') orgId: string, @Body() dto: UpdateOrgDto) {
    return this.orgs.update(orgId, dto.name ?? '');
  }
}
