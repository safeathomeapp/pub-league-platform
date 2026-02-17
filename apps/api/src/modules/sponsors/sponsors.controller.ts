import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrgMembershipGuard } from '../../common/guards/org-membership.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSponsorSlotDto } from './dto/create-sponsor-slot.dto';
import { ListSponsorsQueryDto } from './dto/list-sponsors-query.dto';
import { UpdateSponsorSlotDto } from './dto/update-sponsor-slot.dto';
import { SponsorsService } from './sponsors.service';

@Controller('orgs/:orgId/sponsors')
@UseGuards(JwtAuthGuard, OrgMembershipGuard, RolesGuard)
export class SponsorsController {
  constructor(private sponsors: SponsorsService) {}

  @Get()
  @Roles('ORG_ADMIN', 'COMMISSIONER', 'CAPTAIN', 'PLAYER')
  list(@Param('orgId') orgId: string, @Query() query: ListSponsorsQueryDto) {
    return this.sponsors.list(orgId, query);
  }

  @Post()
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  create(@Param('orgId') orgId: string, @Body() dto: CreateSponsorSlotDto) {
    return this.sponsors.create(orgId, dto);
  }

  @Patch(':sponsorId')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  update(@Param('orgId') orgId: string, @Param('sponsorId') sponsorId: string, @Body() dto: UpdateSponsorSlotDto) {
    return this.sponsors.update(orgId, sponsorId, dto);
  }

  @Delete(':sponsorId')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  remove(@Param('orgId') orgId: string, @Param('sponsorId') sponsorId: string) {
    return this.sponsors.remove(orgId, sponsorId);
  }
}
