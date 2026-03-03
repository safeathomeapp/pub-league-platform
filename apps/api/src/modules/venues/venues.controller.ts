import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrgMembershipGuard } from '../../common/guards/org-membership.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { VenuesService } from './venues.service';

@Controller('orgs/:orgId/venues')
@UseGuards(JwtAuthGuard, OrgMembershipGuard, RolesGuard)
export class VenuesController {
  constructor(private venues: VenuesService) {}

  @Post()
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  create(@Param('orgId') orgId: string, @Body() dto: CreateVenueDto) {
    return this.venues.create(orgId, dto);
  }

  @Get()
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  list(@Param('orgId') orgId: string) {
    return this.venues.list(orgId);
  }

  @Patch(':venueId')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  update(@Param('orgId') orgId: string, @Param('venueId') venueId: string, @Body() dto: UpdateVenueDto) {
    return this.venues.update(orgId, venueId, dto);
  }
}
