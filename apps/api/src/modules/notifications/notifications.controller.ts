import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrgMembershipGuard } from '../../common/guards/org-membership.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SendTestNotificationDto } from './dto/send-test-notification.dto';
import { NotificationsService } from './notifications.service';

@Controller('orgs/:orgId/notifications')
@UseGuards(JwtAuthGuard, OrgMembershipGuard, RolesGuard)
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get('outbox')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  listOutbox(@Param('orgId') orgId: string) {
    return this.notifications.listOutbox(orgId);
  }

  @Post('test')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  queueTest(@Param('orgId') orgId: string, @Body() dto: SendTestNotificationDto) {
    return this.notifications.queueTest(orgId, dto as any);
  }
}
