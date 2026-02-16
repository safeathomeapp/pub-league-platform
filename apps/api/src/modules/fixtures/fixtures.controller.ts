import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrgMembershipGuard } from '../../common/guards/org-membership.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GenerateRoundRobinParamsDto } from './dto/generate-round-robin-params.dto';
import { FixturesService } from './fixtures.service';

@Controller('orgs/:orgId/divisions/:divisionId')
@UseGuards(JwtAuthGuard, OrgMembershipGuard, RolesGuard)
export class FixturesController {
  constructor(private fixtures: FixturesService) {}

  @Post('fixtures:generate')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  generate(@Param() params: GenerateRoundRobinParamsDto) {
    return this.fixtures.generateForDivision(params.orgId, params.divisionId);
  }
}
