import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';

@Injectable()
export class ExportsService {
  constructor(private prisma: PrismaService) {}

  async buildOrgExport(orgId: string) {
    const organisation = await this.prisma.organisation.findUnique({
      where: { id: orgId },
    });
    if (!organisation) throw new NotFoundException('Organisation not found');

    const memberships = await this.prisma.orgMembership.findMany({
      where: { organisationId: orgId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });

    const rulesets = await this.prisma.ruleset.findMany({
      where: { organisationId: orgId },
      orderBy: { createdAt: 'asc' },
    });

    const leagues = await this.prisma.league.findMany({
      where: { organisationId: orgId },
      orderBy: { createdAt: 'asc' },
    });

    const seasons = await this.prisma.season.findMany({
      where: { league: { organisationId: orgId } },
      orderBy: { startDate: 'asc' },
    });

    const divisions = await this.prisma.division.findMany({
      where: { season: { league: { organisationId: orgId } } },
      orderBy: { name: 'asc' },
    });

    const teams = await this.prisma.team.findMany({
      where: { division: { season: { league: { organisationId: orgId } } } },
      orderBy: { name: 'asc' },
    });

    const players = await this.prisma.player.findMany({
      where: { organisationId: orgId },
      orderBy: { createdAt: 'asc' },
    });

    const teamPlayers = await this.prisma.teamPlayer.findMany({
      where: {
        team: { division: { season: { league: { organisationId: orgId } } } },
      },
      orderBy: { joinedAt: 'asc' },
    });

    const fixtures = await this.prisma.fixture.findMany({
      where: { division: { season: { league: { organisationId: orgId } } } },
      orderBy: [{ scheduledAt: 'asc' }, { id: 'asc' }],
    });

    const fixtureIds = fixtures.map(fixture => fixture.id);

    const tokens = fixtureIds.length
      ? await this.prisma.matchControlToken.findMany({
        where: { fixtureId: { in: fixtureIds } },
        orderBy: [{ issuedAt: 'asc' }, { id: 'asc' }],
      })
      : [];

    const events = fixtureIds.length
      ? await this.prisma.matchEvent.findMany({
        where: { fixtureId: { in: fixtureIds } },
        orderBy: [{ fixtureId: 'asc' }, { revision: 'asc' }],
      })
      : [];

    const disputes = fixtureIds.length
      ? await this.prisma.dispute.findMany({
        where: { fixtureId: { in: fixtureIds } },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      })
      : [];

    const divisionIds = divisions.map(division => division.id);
    const standingsSnapshots = divisionIds.length
      ? await this.prisma.standingsSnapshot.findMany({
        where: { divisionId: { in: divisionIds } },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      })
      : [];

    const notificationsOutbox = await this.prisma.notificationOutbox.findMany({
      where: { organisationId: orgId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    return {
      formatVersion: 1,
      generatedAt: new Date().toISOString(),
      organisation,
      memberships: memberships.map(item => ({
        id: item.id,
        organisationId: item.organisationId,
        userId: item.userId,
        role: item.role,
        createdAt: item.createdAt,
        user: { id: item.user.id, email: item.user.email, createdAt: item.user.createdAt },
      })),
      rulesets,
      leagues,
      seasons,
      divisions,
      teams,
      players,
      teamPlayers,
      fixtures,
      matchControlTokens: tokens,
      matchEventLog: events,
      disputes,
      standingsSnapshots,
      notificationsOutbox,
    };
  }
}
