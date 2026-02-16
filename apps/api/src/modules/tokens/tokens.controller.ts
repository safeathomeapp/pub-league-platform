import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrgMembershipGuard } from '../../common/guards/org-membership.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AcceptTokenDto } from './dto/accept-token.dto';
import { IssueTokenDto } from './dto/issue-token.dto';
import { TransferTokenDto } from './dto/transfer-token.dto';
import { TokensService } from './tokens.service';

@Controller('orgs/:orgId/fixtures/:fixtureId')
@UseGuards(JwtAuthGuard, OrgMembershipGuard, RolesGuard)
export class TokensController {
  constructor(private tokens: TokensService) {}

  @Post('tokens\\:issue')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  issue(
    @Param('orgId') orgId: string,
    @Param('fixtureId') fixtureId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: IssueTokenDto,
  ) {
    return this.tokens.issue(orgId, fixtureId, user.id, dto);
  }

  @Post('tokens\\:transfer')
  @Roles('ORG_ADMIN', 'COMMISSIONER', 'CAPTAIN')
  transfer(
    @Param('orgId') orgId: string,
    @Param('fixtureId') fixtureId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: TransferTokenDto,
  ) {
    return this.tokens.transfer(orgId, fixtureId, user.id, dto);
  }

  @Post('tokens\\:accept')
  @Roles('ORG_ADMIN', 'COMMISSIONER', 'CAPTAIN', 'PLAYER')
  accept(
    @Param('orgId') orgId: string,
    @Param('fixtureId') fixtureId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: AcceptTokenDto,
  ) {
    return this.tokens.accept(orgId, fixtureId, user.id, dto);
  }

  @Get('tokens')
  @Roles('ORG_ADMIN', 'COMMISSIONER', 'CAPTAIN', 'PLAYER')
  list(@Param('orgId') orgId: string, @Param('fixtureId') fixtureId: string) {
    return this.tokens.list(orgId, fixtureId);
  }
}
