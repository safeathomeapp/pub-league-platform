import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async listOutbox(
    orgId: string,
    query?: { status?: 'pending' | 'sending' | 'sent' | 'failed'; channel?: 'sms' | 'whatsapp' | 'email'; templateKey?: string },
  ) {
    return this.prisma.notificationOutbox.findMany({
      where: {
        organisationId: orgId,
        ...(query?.status ? { status: query.status } : {}),
        ...(query?.channel ? { channel: query.channel } : {}),
        ...(query?.templateKey ? { templateKey: query.templateKey } : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  async queueTest(orgId: string, data: { channel: 'sms' | 'whatsapp' | 'email'; to: string; message?: string }) {
    return this.prisma.notificationOutbox.create({
      data: {
        organisationId: orgId,
        channel: data.channel,
        to: data.to,
        templateKey: 'notifications.test',
        templateVars: { message: data.message ?? 'Test notification' },
        scheduledFor: new Date(),
      },
    });
  }

  async queueFixtureChangeAndReminder(orgId: string, fixtureId: string, scheduledAt: Date | null) {
    if (!scheduledAt) return;

    const fixture = await this.prisma.fixture.findFirst({
      where: {
        id: fixtureId,
        division: { season: { league: { organisationId: orgId } } },
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });
    if (!fixture) throw new NotFoundException('Fixture not found');

    const captains = await this.prisma.teamPlayer.findMany({
      where: {
        role: 'CAPTAIN',
        teamId: { in: [fixture.homeTeamId, fixture.awayTeamId] },
        player: { organisationId: orgId, contactPhone: { not: null } },
      },
      include: { player: true },
    });

    const uniquePhones = Array.from(
      new Set(
        captains
          .map(captain => captain.player.contactPhone)
          .filter((phone): phone is string => typeof phone === 'string' && phone.length > 0),
      ),
    );
    if (uniquePhones.length === 0) return;

    const now = new Date();
    const reminderAt = new Date(scheduledAt.getTime() - 24 * 60 * 60 * 1000);

    await this.prisma.$transaction(
      uniquePhones.flatMap(phone => {
        const templateVars = {
          fixture_id: fixture.id,
          home_team: fixture.homeTeam.name,
          away_team: fixture.awayTeam.name,
          scheduled_at: scheduledAt.toISOString(),
        };
        const records = [
          this.prisma.notificationOutbox.create({
            data: {
              organisationId: orgId,
              channel: 'sms',
              to: phone,
              templateKey: 'fixture.changed',
              templateVars,
              scheduledFor: now,
            },
          }),
        ];

        if (reminderAt > now) {
          records.push(
            this.prisma.notificationOutbox.create({
              data: {
                organisationId: orgId,
                channel: 'sms',
                to: phone,
                templateKey: 'fixture.reminder',
                templateVars,
                scheduledFor: reminderAt,
              },
            }),
          );
        }

        return records;
      }),
    );
  }

  async queueFixtureCompleted(orgId: string, fixtureId: string, homeFrames: number, awayFrames: number) {
    const fixture = await this.prisma.fixture.findFirst({
      where: {
        id: fixtureId,
        division: { season: { league: { organisationId: orgId } } },
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });
    if (!fixture) throw new NotFoundException('Fixture not found');

    const captains = await this.prisma.teamPlayer.findMany({
      where: {
        role: 'CAPTAIN',
        teamId: { in: [fixture.homeTeamId, fixture.awayTeamId] },
        player: { organisationId: orgId, contactPhone: { not: null } },
      },
      include: { player: true },
    });

    const uniquePhones = Array.from(
      new Set(
        captains
          .map(captain => captain.player.contactPhone)
          .filter((phone): phone is string => typeof phone === 'string' && phone.length > 0),
      ),
    );
    if (uniquePhones.length === 0) return;

    const templateVars = {
      fixture_id: fixture.id,
      home_team: fixture.homeTeam.name,
      away_team: fixture.awayTeam.name,
      home_frames: homeFrames,
      away_frames: awayFrames,
    };

    await this.prisma.$transaction(
      uniquePhones.map(phone =>
        this.prisma.notificationOutbox.create({
          data: {
            organisationId: orgId,
            channel: 'sms',
            to: phone,
            templateKey: 'fixture.completed',
            templateVars,
            scheduledFor: new Date(),
          },
        }),
      ),
    );
  }
}
