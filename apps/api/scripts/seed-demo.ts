import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO = {
  email: 'demo.organiser@publeague.local',
  password: 'demo12345',
  orgName: 'Pub League Demo Org',
  rulesetName: 'English 8-ball Demo Ruleset',
  leagueName: 'Demo Monday League',
  seasonName: 'Demo Season 2026',
  divisionName: 'Demo Division A',
  teams: [
    'Red Lion',
    'King Arms',
    'White Hart',
    'Crown & Anchor',
    'Black Horse',
    'Coach & Horses',
    'Royal Oak',
    'Blue Boar',
  ],
} as const;

async function main() {
  const user = await upsertDemoUser();
  const org = await upsertOrgForUser(user.id);
  const ruleset = await upsertRuleset(org.id);
  const league = await upsertLeague(org.id, ruleset.id);
  const season = await upsertSeason(league.id);
  const division = await upsertDivision(season.id);
  const teams = await upsertTeams(division.id);
  await upsertFixtures(division.id, teams);
  await upsertTeamPlayers(org.id, teams);

  // eslint-disable-next-line no-console
  console.log('Demo seed complete');
  // eslint-disable-next-line no-console
  console.log(`Email: ${DEMO.email}`);
  // eslint-disable-next-line no-console
  console.log(`Password: ${DEMO.password}`);
  // eslint-disable-next-line no-console
  console.log(`Org ID: ${org.id}`);
  // eslint-disable-next-line no-console
  console.log(`Division ID: ${division.id}`);
}

async function upsertDemoUser() {
  const password = await bcrypt.hash(DEMO.password, 10);
  const existing = await prisma.user.findUnique({ where: { email: DEMO.email } });
  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: { password },
    });
  }

  return prisma.user.create({
    data: { email: DEMO.email, password },
  });
}

async function upsertOrgForUser(userId: string) {
  const existing = await prisma.organisation.findFirst({
    where: { name: DEMO.orgName },
  });
  const org = existing ?? (await prisma.organisation.create({ data: { name: DEMO.orgName } }));

  const membership = await prisma.orgMembership.findUnique({
    where: { organisationId_userId: { organisationId: org.id, userId } },
    select: { id: true },
  });
  if (!membership) {
    await prisma.orgMembership.create({
      data: { organisationId: org.id, userId, role: 'ORG_ADMIN' },
    });
  } else {
    await prisma.orgMembership.update({
      where: { organisationId_userId: { organisationId: org.id, userId } },
      data: { role: 'ORG_ADMIN' },
    });
  }

  return org;
}

async function upsertRuleset(orgId: string) {
  const existing = await prisma.ruleset.findFirst({
    where: { organisationId: orgId, name: DEMO.rulesetName, sport: 'pool' },
  });
  if (existing) return existing;

  return prisma.ruleset.create({
    data: {
      organisationId: orgId,
      name: DEMO.rulesetName,
      sport: 'pool',
      config: {
        frames_total: 10,
        allow_draw: false,
        points_model: { win: 2, draw: 1, loss: 0 },
      },
    },
  });
}

async function upsertLeague(orgId: string, rulesetId: string) {
  const existing = await prisma.league.findFirst({
    where: { organisationId: orgId, name: DEMO.leagueName },
  });
  if (existing) return existing;

  return prisma.league.create({
    data: {
      organisationId: orgId,
      name: DEMO.leagueName,
      sport: 'pool',
      rulesetId,
    },
  });
}

async function upsertSeason(leagueId: string) {
  const existing = await prisma.season.findFirst({
    where: { leagueId, name: DEMO.seasonName },
  });
  if (existing) return existing;

  return prisma.season.create({
    data: {
      leagueId,
      name: DEMO.seasonName,
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T00:00:00.000Z'),
    },
  });
}

async function upsertDivision(seasonId: string) {
  const existing = await prisma.division.findFirst({
    where: { seasonId, name: DEMO.divisionName },
  });
  if (existing) return existing;

  return prisma.division.create({
    data: { seasonId, name: DEMO.divisionName },
  });
}

async function upsertTeams(divisionId: string) {
  const teams = [];
  for (const name of DEMO.teams) {
    const existing = await prisma.team.findFirst({
      where: { divisionId, name },
    });
    teams.push(
      existing ??
      (await prisma.team.create({
        data: { divisionId, name },
      })),
    );
  }
  return teams;
}

async function upsertFixtures(divisionId: string, teams: Array<{ id: string }>) {
  const existing = await prisma.fixture.findMany({
    where: { divisionId },
    select: { homeTeamId: true, awayTeamId: true },
  });
  const existingPairs = new Set(
    existing.map(item => pairKey(item.homeTeamId, item.awayTeamId)),
  );

  const start = new Date('2026-03-02T19:30:00.000Z').getTime();
  let offset = 0;

  for (let i = 0; i < teams.length; i += 1) {
    for (let j = i + 1; j < teams.length; j += 1) {
      const homeTeamId = teams[i].id;
      const awayTeamId = teams[j].id;
      const key = pairKey(homeTeamId, awayTeamId);
      if (existingPairs.has(key)) continue;

      await prisma.fixture.create({
        data: {
          divisionId,
          homeTeamId,
          awayTeamId,
          scheduledAt: new Date(start + offset * 7 * 24 * 60 * 60 * 1000),
          status: 'scheduled',
        },
      });
      offset += 1;
    }
  }
}

async function upsertTeamPlayers(orgId: string, teams: Array<{ id: string; name?: string }>) {
  let index = 1;
  for (const team of teams) {
    const teamWithSeason = await prisma.team.findUnique({
      where: { id: team.id },
      select: { division: { select: { seasonId: true } } },
    });
    if (!teamWithSeason) continue;

    const seededPlayers = [
      {
        displayName: `Captain ${index}`,
        contactEmail: `captain${index}@demo.publeague.local`,
        contactPhone: `+4477009${(10000 + index).toString().slice(-5)}`,
        role: 'CAPTAIN' as const,
      },
      {
        displayName: `Player ${index}A`,
        contactEmail: `player${index}a@demo.publeague.local`,
        contactPhone: `+4477008${(10000 + index).toString().slice(-5)}`,
        role: 'PLAYER' as const,
      },
      {
        displayName: `Player ${index}B`,
        contactEmail: `player${index}b@demo.publeague.local`,
        contactPhone: `+4477007${(10000 + index).toString().slice(-5)}`,
        role: 'PLAYER' as const,
      },
    ];

    for (const seeded of seededPlayers) {
      const existingPlayer = await prisma.player.findFirst({
        where: { organisationId: orgId, contactEmail: seeded.contactEmail },
      });

      const player =
        existingPlayer ??
        (await prisma.player.create({
          data: {
            organisationId: orgId,
            displayName: seeded.displayName,
            contactEmail: seeded.contactEmail,
            contactPhone: seeded.contactPhone,
          },
        }));

      const rosterEntry = await prisma.teamPlayer.findUnique({
        where: { teamId_playerId: { teamId: team.id, playerId: player.id } },
        select: { id: true },
      });
      if (!rosterEntry) {
        await prisma.teamPlayer.create({
          data: { teamId: team.id, seasonId: teamWithSeason.division.seasonId, playerId: player.id, role: seeded.role },
        });
      } else {
        await prisma.teamPlayer.update({
          where: { teamId_playerId: { teamId: team.id, playerId: player.id } },
          data: { role: seeded.role },
        });
      }
    }

    index += 1;
  }
}

function pairKey(a: string, b: string) {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

main()
  .catch(error => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
