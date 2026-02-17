import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrgMembershipGuard } from '../../common/guards/org-membership.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompleteMatchDto } from './dto/complete-match.dto';
import { CreateMatchEventDto } from './dto/create-match-event.dto';
import { ReviewResultDto } from './dto/review-result.dto';
import { SubmitResultDto } from './dto/submit-result.dto';
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
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  complete(
    @Param('orgId') orgId: string,
    @Param('fixtureId') fixtureId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CompleteMatchDto,
  ) {
    return this.events.complete(orgId, fixtureId, user.id, dto);
  }

  @Post('submit')
  @Roles('ORG_ADMIN', 'COMMISSIONER', 'CAPTAIN', 'PLAYER')
  submit(
    @Param('orgId') orgId: string,
    @Param('fixtureId') fixtureId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: SubmitResultDto,
  ) {
    return this.events.submit(orgId, fixtureId, user.id, dto);
  }

  @Post('approve')
  @Roles('ORG_ADMIN', 'COMMISSIONER', 'CAPTAIN', 'PLAYER')
  approve(
    @Param('orgId') orgId: string,
    @Param('fixtureId') fixtureId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: ReviewResultDto,
  ) {
    return this.events.approve(orgId, fixtureId, user.id, dto);
  }

  @Post('reject')
  @Roles('ORG_ADMIN', 'COMMISSIONER', 'CAPTAIN', 'PLAYER')
  reject(
    @Param('orgId') orgId: string,
    @Param('fixtureId') fixtureId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: ReviewResultDto,
  ) {
    return this.events.reject(orgId, fixtureId, user.id, dto);
  }
}
