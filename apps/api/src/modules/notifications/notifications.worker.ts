import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { LocalMessagingProvider, MessagingProvider } from './messaging.provider';

@Injectable()
export class NotificationsWorker implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;
  private provider: MessagingProvider = new LocalMessagingProvider();

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;
    this.timer = setInterval(() => {
      void this.processDue();
    }, 30_000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async processDue(limit = 100) {
    const due = await this.prisma.notificationOutbox.findMany({
      where: {
        status: 'pending',
        scheduledFor: { lte: new Date() },
      },
      orderBy: [{ scheduledFor: 'asc' }, { id: 'asc' }],
      take: limit,
    });

    for (const item of due) {
      try {
        await this.prisma.notificationOutbox.update({
          where: { id: item.id },
          data: { status: 'sending' },
        });

        const message = this.renderMessage(item.templateKey, item.templateVars as Record<string, unknown> | null);
        const sent = await this.provider.send({
          channel: item.channel,
          to: item.to,
          message,
          metadata: { outbox_id: item.id, org_id: item.organisationId },
        });

        await this.prisma.notificationOutbox.update({
          where: { id: item.id },
          data: {
            status: 'sent',
            attempts: item.attempts + 1,
            providerMessageId: sent.providerMessageId,
            lastError: null,
          },
        });
      } catch (error) {
        const attempts = item.attempts + 1;
        const retryDelaysMs = [60_000, 10 * 60_000, 60 * 60_000];
        const canRetry = attempts < 3;
        await this.prisma.notificationOutbox.update({
          where: { id: item.id },
          data: {
            status: canRetry ? 'pending' : 'failed',
            attempts,
            scheduledFor: canRetry ? new Date(Date.now() + retryDelaysMs[Math.min(attempts - 1, 2)]) : item.scheduledFor,
            lastError: error instanceof Error ? error.message : 'Notification send failed',
          },
        });
      }
    }
  }

  private renderMessage(templateKey: string, vars: Record<string, unknown> | null): string {
    const safeVars = vars ?? {};
    if (templateKey === 'fixture.reminder') {
      return `Reminder: ${safeVars.home_team ?? 'Home'} vs ${safeVars.away_team ?? 'Away'} at ${safeVars.scheduled_at ?? ''}`;
    }
    if (templateKey === 'fixture.changed') {
      return `Fixture updated: ${safeVars.home_team ?? 'Home'} vs ${safeVars.away_team ?? 'Away'} at ${safeVars.scheduled_at ?? ''}`;
    }
    if (templateKey === 'fixture.completed') {
      return `Result: ${safeVars.home_team ?? 'Home'} ${safeVars.home_frames ?? '-'}-${safeVars.away_frames ?? '-'} ${safeVars.away_team ?? 'Away'}`;
    }
    return (safeVars.message as string | undefined) ?? 'Notification';
  }
}
