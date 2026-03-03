import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrgMembershipGuard } from '../../common/guards/org-membership.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateDivisionDto } from './dto/create-division.dto';
import { CreateSeasonDto } from './dto/create-season.dto';
import { UpdateSeasonDto } from './dto/update-season.dto';
import { SeasonsService } from './seasons.service';

@Controller('orgs/:orgId')
@UseGuards(JwtAuthGuard, OrgMembershipGuard, RolesGuard)
export class SeasonsController {
  constructor(private seasons: SeasonsService) {}

  @Post('leagues/:leagueId/seasons')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  createSeason(@Param('orgId') orgId: string, @Param('leagueId') leagueId: string, @Body() dto: CreateSeasonDto) {
    return this.seasons.createSeason(orgId, leagueId, dto);
  }

  @Get('leagues/:leagueId/seasons')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  listSeasons(@Param('orgId') orgId: string, @Param('leagueId') leagueId: string) {
    return this.seasons.listSeasons(orgId, leagueId);
  }

  @Get('seasons/:seasonId')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  getSeason(@Param('orgId') orgId: string, @Param('seasonId') seasonId: string) {
    return this.seasons.getSeason(orgId, seasonId);
  }

  @Patch('seasons/:seasonId')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  updateSeason(@Param('orgId') orgId: string, @Param('seasonId') seasonId: string, @Body() dto: UpdateSeasonDto) {
    return this.seasons.updateSeason(orgId, seasonId, dto);
  }

  @Post('seasons/:seasonId/divisions')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  createDivision(@Param('orgId') orgId: string, @Param('seasonId') seasonId: string, @Body() dto: CreateDivisionDto) {
    return this.seasons.createDivision(orgId, seasonId, dto.name);
  }

  @Get('seasons/:seasonId/divisions')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  listDivisions(@Param('orgId') orgId: string, @Param('seasonId') seasonId: string) {
    return this.seasons.listDivisions(orgId, seasonId);
  }
}
