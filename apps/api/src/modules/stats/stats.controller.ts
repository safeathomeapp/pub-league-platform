import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrgMembershipGuard } from '../../common/guards/org-membership.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HeadToHeadQueryDto } from './dto/head-to-head-query.dto';
import { StatsService } from './stats.service';

@Controller('orgs/:orgId/stats')
@UseGuards(JwtAuthGuard, OrgMembershipGuard, RolesGuard)
export class StatsController {
  constructor(private stats: StatsService) {}

  @Get('head-to-head')
  @Roles('ORG_ADMIN', 'COMMISSIONER', 'CAPTAIN', 'PLAYER')
  headToHead(@Param('orgId') orgId: string, @Query() query: HeadToHeadQueryDto) {
    return this.stats.headToHead(orgId, query);
  }
}
