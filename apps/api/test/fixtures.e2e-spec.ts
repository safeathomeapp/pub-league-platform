import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { api, bootstrapTestApp } from './test-utils';

describe('fixtures (e2e)', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    app = await bootstrapTestApp();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('generates round-robin fixtures for a division with null scheduledAt', async () => {
    const email = `fixtures_${Date.now()}@example.com`;
    const outsiderEmail = `fixtures_outsider_${Date.now()}@example.com`;
    const password = 'password1234';

    const reg = await api(app).post('/api/v1/auth/register').send({ email, password }).expect(201);
    const token = reg.body.accessToken;
    const outsiderReg = await api(app).post('/api/v1/auth/register').send({ email: outsiderEmail, password }).expect(201);
    const outsiderToken = outsiderReg.body.accessToken;

    const org = await api(app).post('/api/v1/orgs').set('Authorization', `Bearer ${token}`).send({ name: 'Fixture Org' }).expect(201);
    const orgId = org.body.id;

    const ruleset = await prisma.ruleset.create({
      data: {
        organisationId: orgId,
        name: 'English 8-ball',
        sport: 'pool',
        config: { frames_total: 10, allow_draw: false, points_model: { win: 2, loss: 0 } },
      },
    });

    const league = await prisma.league.create({
      data: {
        organisationId: orgId,
        name: 'League 1',
        sport: 'pool',
        rulesetId: ruleset.id,
      },
    });

    const season = await prisma.season.create({
      data: {
        leagueId: league.id,
        name: 'Season 1',
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        endDate: new Date('2026-12-31T00:00:00.000Z'),
      },
    });

    const division = await prisma.division.create({
      data: { seasonId: season.id, name: 'Division 1' },
    });

    const teams = await prisma.$transaction([
      prisma.team.create({ data: { divisionId: division.id, name: 'Team A' } }),
      prisma.team.create({ data: { divisionId: division.id, name: 'Team B' } }),
      prisma.team.create({ data: { divisionId: division.id, name: 'Team C' } }),
      prisma.team.create({ data: { divisionId: division.id, name: 'Team D' } }),
    ]);

    const generate = await api(app)
      .post(`/api/v1/orgs/${orgId}/divisions/${division.id}/fixtures:generate`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    expect(generate.body.createdCount).toBe(6);
    expect(generate.body.fixtures).toHaveLength(6);
    expect(generate.body.fixtures.every((fixture: { scheduledAt: string | null }) => fixture.scheduledAt === null)).toBe(true);

    const pairKeys = new Set<string>(
      generate.body.fixtures.map((fixture: { homeTeamId: string; awayTeamId: string }) =>
        [fixture.homeTeamId, fixture.awayTeamId].sort().join(':'),
      ),
    );

    expect(pairKeys.size).toBe(6);

    const expectedTeams = new Set(teams.map(team => team.id));
    for (const pairKey of pairKeys) {
      const [homeTeamId, awayTeamId] = pairKey.split(':');
      expect(expectedTeams.has(homeTeamId)).toBe(true);
      expect(expectedTeams.has(awayTeamId)).toBe(true);
      expect(homeTeamId).not.toBe(awayTeamId);
    }

    const secondGenerate = await api(app)
      .post(`/api/v1/orgs/${orgId}/divisions/${division.id}/fixtures:generate`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    expect(secondGenerate.body.createdCount).toBe(0);

    const listed = await api(app)
      .get(`/api/v1/orgs/${orgId}/divisions/${division.id}/fixtures`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(Array.isArray(listed.body)).toBe(true);
    expect(listed.body).toHaveLength(6);

    const targetFixtureId = listed.body[0].id as string;
    const fetched = await api(app)
      .get(`/api/v1/orgs/${orgId}/fixtures/${targetFixtureId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(fetched.body.id).toBe(targetFixtureId);

    const patched = await api(app)
      .patch(`/api/v1/orgs/${orgId}/fixtures/${targetFixtureId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        scheduledAt: '2026-04-15T19:30:00.000Z',
        status: 'in_progress',
      })
      .expect(200);
    expect(patched.body.status).toBe('in_progress');
    expect(patched.body.scheduledAt).toBe('2026-04-15T19:30:00.000Z');

    await api(app)
      .get(`/api/v1/orgs/${orgId}/divisions/${division.id}/fixtures`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(403);

    const fixtureCount = await prisma.fixture.count({ where: { divisionId: division.id } });
    expect(fixtureCount).toBe(6);
  });
});
