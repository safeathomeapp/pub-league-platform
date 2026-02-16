import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrgMembershipGuard } from '../../common/guards/org-membership.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompleteMatchDto } from './dto/complete-match.dto';
import { CreateMatchEventDto } from './dto/create-match-event.dto';
import { MatchEventsService } from './match-events.service';

@Controller('orgs/:orgId/fixtures/:fixtureId')
@UseGuards(JwtAuthGuard, OrgMembershipGuard, RolesGuard)
export class MatchEventsController {
  constructor(private events: MatchEventsService) {}

  @Post('events')
  @Roles('ORG_ADMIN', 'COMMISSIONER', 'CAPTAIN', 'PLAYER')
  append(
    @Param('orgId') orgId: string,
    @Param('fixtureId') fixtureId: string,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
    @Body() dto: CreateMatchEventDto,
  ) {
    return this.events.append(orgId, fixtureId, user.id, req.ctx?.role, dto);
  }

  @Get('events')
  @Roles('ORG_ADMIN', 'COMMISSIONER', 'CAPTAIN', 'PLAYER')
  list(@Param('orgId') orgId: string, @Param('fixtureId') fixtureId: string) {
    return this.events.list(orgId, fixtureId);
  }

  @Post('complete')
  @Roles('ORG_ADMIN', 'COMMISSIONER', 'CAPTAIN', 'PLAYER')
  complete(
    @Param('orgId') orgId: string,
    @Param('fixtureId') fixtureId: string,
    @CurrentUser() user: { id: string },
    @Req() req: Request,
    @Body() dto: CompleteMatchDto,
  ) {
    return this.events.complete(orgId, fixtureId, user.id, req.ctx?.role, dto);
  }
}
