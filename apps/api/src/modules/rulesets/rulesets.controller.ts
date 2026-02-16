import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrgMembershipGuard } from '../../common/guards/org-membership.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateRulesetDto } from './dto/create-ruleset.dto';
import { UpdateRulesetDto } from './dto/update-ruleset.dto';
import { RulesetsService } from './rulesets.service';

@Controller('orgs/:orgId/rulesets')
@UseGuards(JwtAuthGuard, OrgMembershipGuard, RolesGuard)
export class RulesetsController {
  constructor(private rulesets: RulesetsService) {}

  @Get()
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  list(@Param('orgId') orgId: string) {
    return this.rulesets.list(orgId);
  }

  @Post()
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  create(@Param('orgId') orgId: string, @Body() dto: CreateRulesetDto) {
    return this.rulesets.create(orgId, dto.name, dto.sport, dto.config as Prisma.InputJsonValue);
  }

  @Get(':rulesetId')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  get(@Param('orgId') orgId: string, @Param('rulesetId') rulesetId: string) {
    return this.rulesets.get(orgId, rulesetId);
  }

  @Patch(':rulesetId')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  patch(@Param('orgId') orgId: string, @Param('rulesetId') rulesetId: string, @Body() dto: UpdateRulesetDto) {
    return this.rulesets.update(orgId, rulesetId, {
      name: dto.name,
      sport: dto.sport,
      config: dto.config as Prisma.InputJsonValue | undefined,
    });
  }
}
