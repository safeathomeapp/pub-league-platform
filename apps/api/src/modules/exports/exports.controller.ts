import { Controller, Get, Header, Param, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrgMembershipGuard } from '../../common/guards/org-membership.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExportsService } from './exports.service';

@Controller('orgs/:orgId')
@UseGuards(JwtAuthGuard, OrgMembershipGuard, RolesGuard)
export class ExportsController {
  constructor(private exportsService: ExportsService) {}

  @Get('export')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  @Header('Content-Type', 'application/json; charset=utf-8')
  async exportOrg(@Param('orgId') orgId: string) {
    return this.exportsService.buildOrgExport(orgId);
  }
}
