import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrgMembershipGuard } from '../../common/guards/org-membership.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddTeamPlayerDto } from './dto/add-team-player.dto';
import { CreatePlayerDto } from './dto/create-player.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamsPlayersService } from './teams-players.service';

@Controller('orgs/:orgId')
@UseGuards(JwtAuthGuard, OrgMembershipGuard, RolesGuard)
export class TeamsPlayersController {
  constructor(private teamsPlayers: TeamsPlayersService) {}

  @Post('divisions/:divisionId/teams')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  createTeam(@Param('orgId') orgId: string, @Param('divisionId') divisionId: string, @Body() dto: CreateTeamDto) {
    return this.teamsPlayers.createTeam(orgId, divisionId, dto.name);
  }

  @Get('divisions/:divisionId/teams')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  listTeams(@Param('orgId') orgId: string, @Param('divisionId') divisionId: string) {
    return this.teamsPlayers.listTeams(orgId, divisionId);
  }

  @Patch('teams/:teamId')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  updateTeam(@Param('orgId') orgId: string, @Param('teamId') teamId: string, @Body() dto: UpdateTeamDto) {
    return this.teamsPlayers.updateTeam(orgId, teamId, dto.name);
  }

  @Post('players')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  createPlayer(@Param('orgId') orgId: string, @Body() dto: CreatePlayerDto) {
    return this.teamsPlayers.createPlayer(orgId, dto);
  }

  @Get('players')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  listPlayers(@Param('orgId') orgId: string) {
    return this.teamsPlayers.listPlayers(orgId);
  }

  @Patch('players/:playerId')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  updatePlayer(@Param('orgId') orgId: string, @Param('playerId') playerId: string, @Body() dto: UpdatePlayerDto) {
    return this.teamsPlayers.updatePlayer(orgId, playerId, dto);
  }

  @Post('teams/:teamId/players')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  addTeamPlayer(@Param('orgId') orgId: string, @Param('teamId') teamId: string, @Body() dto: AddTeamPlayerDto) {
    return this.teamsPlayers.addTeamPlayer(orgId, teamId, dto.playerId, dto.role);
  }

  @Delete('teams/:teamId/players/:playerId')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  removeTeamPlayer(@Param('orgId') orgId: string, @Param('teamId') teamId: string, @Param('playerId') playerId: string) {
    return this.teamsPlayers.removeTeamPlayer(orgId, teamId, playerId);
  }
}
