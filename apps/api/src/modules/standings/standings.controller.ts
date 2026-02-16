import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrgMembershipGuard } from '../../common/guards/org-membership.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StandingsService } from './standings.service';

@Controller('orgs/:orgId/divisions/:divisionId')
@UseGuards(JwtAuthGuard, OrgMembershipGuard, RolesGuard)
export class StandingsController {
  constructor(private standings: StandingsService) {}

  @Get('standings')
  @Roles('ORG_ADMIN', 'COMMISSIONER', 'CAPTAIN', 'PLAYER')
  get(@Param('orgId') orgId: string, @Param('divisionId') divisionId: string) {
    return this.standings.recomputeAndSnapshot(orgId, divisionId);
  }
}
