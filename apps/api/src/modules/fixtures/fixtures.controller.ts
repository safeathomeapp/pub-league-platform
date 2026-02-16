import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrgMembershipGuard } from '../../common/guards/org-membership.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GenerateRoundRobinParamsDto } from './dto/generate-round-robin-params.dto';
import { ListFixturesQueryDto } from './dto/list-fixtures-query.dto';
import { UpdateFixtureDto } from './dto/update-fixture.dto';
import { FixturesService } from './fixtures.service';

@Controller('orgs/:orgId')
@UseGuards(JwtAuthGuard, OrgMembershipGuard, RolesGuard)
export class FixturesController {
  constructor(private fixtures: FixturesService) {}

  @Post('divisions/:divisionId/fixtures:generate')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  generate(@Param() params: GenerateRoundRobinParamsDto) {
    return this.fixtures.generateForDivision(params.orgId, params.divisionId);
  }

  @Get('divisions/:divisionId/fixtures')
  @Roles('ORG_ADMIN', 'COMMISSIONER', 'CAPTAIN', 'PLAYER')
  list(@Param('orgId') orgId: string, @Param('divisionId') divisionId: string, @Query() query: ListFixturesQueryDto) {
    return this.fixtures.listForDivision(orgId, divisionId, query);
  }

  @Get('fixtures/:fixtureId')
  @Roles('ORG_ADMIN', 'COMMISSIONER', 'CAPTAIN', 'PLAYER')
  get(@Param('orgId') orgId: string, @Param('fixtureId') fixtureId: string) {
    return this.fixtures.getById(orgId, fixtureId);
  }

  @Patch('fixtures/:fixtureId')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  patch(@Param('orgId') orgId: string, @Param('fixtureId') fixtureId: string, @Body() dto: UpdateFixtureDto) {
    return this.fixtures.update(orgId, fixtureId, dto);
  }
}
