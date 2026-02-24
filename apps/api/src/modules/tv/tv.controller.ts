import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrgMembershipGuard } from '../../common/guards/org-membership.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TvOverlayQueryDto } from './dto/tv-overlay-query.dto';
import { TvService } from './tv.service';

@Controller('orgs/:orgId/tv')
@UseGuards(JwtAuthGuard, OrgMembershipGuard, RolesGuard)
export class TvController {
  constructor(private tv: TvService) {}

  @Get('overlay')
  @Roles('ORG_ADMIN', 'COMMISSIONER', 'CAPTAIN', 'PLAYER')
  overlay(@Param('orgId') orgId: string, @Query() query: TvOverlayQueryDto) {
    return this.tv.getOverlay(orgId, query);
  }
}
