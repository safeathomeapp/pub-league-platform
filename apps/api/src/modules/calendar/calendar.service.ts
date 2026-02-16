import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';

type CalendarFixture = {
  id: string;
  scheduledAt: Date;
  homeTeamName: string;
  awayTeamName: string;
};

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async getDivisionFeed(orgId: string, divisionId: string): Promise<string> {
    const division = await this.prisma.division.findFirst({
      where: {
        id: divisionId,
        season: { league: { organisationId: orgId } },
      },
      include: {
        fixtures: {
          where: { scheduledAt: { not: null } },
          include: { homeTeam: true, awayTeam: true },
          orderBy: [{ scheduledAt: 'asc' }, { id: 'asc' }],
        },
      },
    });
    if (!division) throw new NotFoundException('Division not found');

    return this.renderCalendar(
      `Division ${division.name} Fixtures`,
      division.fixtures.map(fixture => ({
        id: fixture.id,
        scheduledAt: fixture.scheduledAt as Date,
        homeTeamName: fixture.homeTeam.name,
        awayTeamName: fixture.awayTeam.name,
      })),
    );
  }

  async getTeamFeed(orgId: string, teamId: string): Promise<string> {
    const team = await this.prisma.team.findFirst({
      where: {
        id: teamId,
        division: { season: { league: { organisationId: orgId } } },
      },
      select: { id: true, name: true },
    });
    if (!team) throw new NotFoundException('Team not found');

    const fixtures = await this.prisma.fixture.findMany({
      where: {
        scheduledAt: { not: null },
        division: { season: { league: { organisationId: orgId } } },
        OR: [{ homeTeamId: team.id }, { awayTeamId: team.id }],
      },
      include: { homeTeam: true, awayTeam: true },
      orderBy: [{ scheduledAt: 'asc' }, { id: 'asc' }],
    });

    return this.renderCalendar(
      `Team ${team.name} Fixtures`,
      fixtures.map(fixture => ({
        id: fixture.id,
        scheduledAt: fixture.scheduledAt as Date,
        homeTeamName: fixture.homeTeam.name,
        awayTeamName: fixture.awayTeam.name,
      })),
    );
  }

  private renderCalendar(name: string, fixtures: CalendarFixture[]): string {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//PubLeague//Platform//EN',
      'CALSCALE:GREGORIAN',
      `X-WR-CALNAME:${this.escapeText(name)}`,
      'X-WR-TIMEZONE:Europe/London',
    ];

    for (const fixture of fixtures) {
      const startUtc = fixture.scheduledAt;
      const endUtc = new Date(startUtc.getTime() + 2 * 60 * 60 * 1000);

      lines.push(
        'BEGIN:VEVENT',
        `UID:${fixture.id}@publeague`,
        `DTSTAMP:${this.formatUtcDateTime(new Date())}`,
        // Render event times in Europe/London while DB stays UTC.
        `DTSTART;TZID=Europe/London:${this.formatLocalDateTime(startUtc, 'Europe/London')}`,
        `DTEND;TZID=Europe/London:${this.formatLocalDateTime(endUtc, 'Europe/London')}`,
        `SUMMARY:${this.escapeText(`${fixture.homeTeamName} vs ${fixture.awayTeamName}`)}`,
        'END:VEVENT',
      );
    }

    lines.push('END:VCALENDAR');
    return `${lines.join('\r\n')}\r\n`;
  }

  private formatUtcDateTime(date: Date): string {
    const yyyy = date.getUTCFullYear().toString().padStart(4, '0');
    const mm = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const dd = date.getUTCDate().toString().padStart(2, '0');
    const hh = date.getUTCHours().toString().padStart(2, '0');
    const mi = date.getUTCMinutes().toString().padStart(2, '0');
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
  }

  private formatLocalDateTime(date: Date, timeZone: string): string {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const byType: Record<string, string> = {};
    for (const part of parts) byType[part.type] = part.value;
    return `${byType.year}${byType.month}${byType.day}T${byType.hour}${byType.minute}${byType.second}`;
  }

  private escapeText(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');
  }
}
