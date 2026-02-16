import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrgMembershipGuard } from '../../common/guards/org-membership.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeDto } from './dto/update-dispute.dto';
import { DisputesService } from './disputes.service';

@Controller('orgs/:orgId')
@UseGuards(JwtAuthGuard, OrgMembershipGuard, RolesGuard)
export class DisputesController {
  constructor(private disputes: DisputesService) {}

  @Post('fixtures/:fixtureId/disputes')
  @Roles('ORG_ADMIN', 'COMMISSIONER', 'CAPTAIN')
  create(
    @Param('orgId') orgId: string,
    @Param('fixtureId') fixtureId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateDisputeDto,
  ) {
    return this.disputes.create(orgId, fixtureId, user.id, dto.reason);
  }

  @Get('fixtures/:fixtureId/disputes')
  @Roles('ORG_ADMIN', 'COMMISSIONER', 'CAPTAIN', 'PLAYER')
  list(@Param('orgId') orgId: string, @Param('fixtureId') fixtureId: string) {
    return this.disputes.listByFixture(orgId, fixtureId);
  }

  @Patch('disputes/:disputeId')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  patch(
    @Param('orgId') orgId: string,
    @Param('disputeId') disputeId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateDisputeDto,
  ) {
    return this.disputes.update(orgId, disputeId, user.id, dto);
  }
}
