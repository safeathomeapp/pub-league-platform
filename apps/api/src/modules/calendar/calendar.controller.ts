import { Controller, Get, Header, Param, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrgMembershipGuard } from '../../common/guards/org-membership.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CalendarService } from './calendar.service';

@Controller('orgs/:orgId/calendar')
@UseGuards(JwtAuthGuard, OrgMembershipGuard, RolesGuard)
export class CalendarController {
  constructor(private calendar: CalendarService) {}

  @Get('divisions/:divisionId.ics')
  @Roles('ORG_ADMIN', 'COMMISSIONER', 'CAPTAIN', 'PLAYER')
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  getDivisionFeed(@Param('orgId') orgId: string, @Param('divisionId') divisionId: string) {
    return this.calendar.getDivisionFeed(orgId, divisionId);
  }

  @Get('teams/:teamId.ics')
  @Roles('ORG_ADMIN', 'COMMISSIONER', 'CAPTAIN', 'PLAYER')
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  getTeamFeed(@Param('orgId') orgId: string, @Param('teamId') teamId: string) {
    return this.calendar.getTeamFeed(orgId, teamId);
  }
}
