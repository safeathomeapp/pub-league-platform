import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { OrgMembershipGuard } from '../../common/guards/org-membership.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ListOutboxQueryDto } from './dto/list-outbox-query.dto';
import { NotificationsMonitoringQueryDto } from './dto/notifications-monitoring-query.dto';
import { SendTestNotificationDto } from './dto/send-test-notification.dto';
import { NotificationsService } from './notifications.service';

@Controller('orgs/:orgId/notifications')
@UseGuards(JwtAuthGuard, OrgMembershipGuard, RolesGuard)
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get('outbox')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  listOutbox(@Param('orgId') orgId: string, @Query() query: ListOutboxQueryDto) {
    return this.notifications.listOutbox(orgId, {
      status: query.status as 'pending' | 'sending' | 'sent' | 'failed' | undefined,
      channel: query.channel as 'sms' | 'whatsapp' | 'email' | undefined,
      templateKey: query.templateKey,
    });
  }

  @Get('monitoring')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  monitoring(@Param('orgId') orgId: string, @Query() query: NotificationsMonitoringQueryDto) {
    return this.notifications.getMonitoringSummary(orgId, query.hours ?? 24);
  }

  @Post('test')
  @Roles('ORG_ADMIN', 'COMMISSIONER')
  queueTest(@Param('orgId') orgId: string, @Body() dto: SendTestNotificationDto) {
    return this.notifications.queueTest(orgId, dto as any);
  }
}
