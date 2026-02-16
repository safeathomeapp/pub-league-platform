import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrgMembershipGuard } from '../../common/guards/org-membership.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateLeagueDto } from './dto/create-league.dto';
import { UpdateLeagueDto } from './dto/update-league.dto';
import { LeaguesService } from './leagues.service';

@Controller('orgs/:orgId/leagues')
@UseGuards(JwtAuthGuard, OrgMembershipGuard, RolesGuard)
export class LeaguesController {
  constructor(private leagues: LeaguesService) {}

  @Post()
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  create(@Param('orgId') orgId: string, @Body() dto: CreateLeagueDto) {
    return this.leagues.create(orgId, dto.name, dto.sport, dto.rulesetId);
  }

  @Get()
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  list(@Param('orgId') orgId: string) {
    return this.leagues.list(orgId);
  }

  @Get(':leagueId')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  get(@Param('orgId') orgId: string, @Param('leagueId') leagueId: string) {
    return this.leagues.get(orgId, leagueId);
  }

  @Patch(':leagueId')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  patch(@Param('orgId') orgId: string, @Param('leagueId') leagueId: string, @Body() dto: UpdateLeagueDto) {
    return this.leagues.update(orgId, leagueId, dto);
  }
}
