import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { api, bootstrapTestApp } from './test-utils';

describe('calendar (e2e)', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    app = await bootstrapTestApp();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('serves division/team .ics feeds and reflects fixture reschedules', async () => {
    const email = `calendar_${Date.now()}@example.com`;
    const outsiderEmail = `calendar_outsider_${Date.now()}@example.com`;
    const password = 'password1234';

    const reg = await api(app).post('/api/v1/auth/register').send({ email, password }).expect(201);
    const token = reg.body.accessToken;
    const outsiderReg = await api(app).post('/api/v1/auth/register').send({ email: outsiderEmail, password }).expect(201);
    const outsiderToken = outsiderReg.body.accessToken;

    const org = await api(app).post('/api/v1/orgs').set('Authorization', `Bearer ${token}`).send({ name: 'Calendar Org' }).expect(201);
    const orgId = org.body.id;

    await api(app).post('/api/v1/orgs').set('Authorization', `Bearer ${outsiderToken}`).send({ name: 'Other Org' }).expect(201);

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

    const [teamA, teamB] = await prisma.$transaction([
      prisma.team.create({ data: { divisionId: division.id, name: 'Team A' } }),
      prisma.team.create({ data: { divisionId: division.id, name: 'Team B' } }),
    ]);

    await api(app)
      .post(`/api/v1/orgs/${orgId}/divisions/${division.id}/fixtures:generate`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    const fixtures = await api(app)
      .get(`/api/v1/orgs/${orgId}/divisions/${division.id}/fixtures`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const fixtureId = fixtures.body[0].id as string;

    await api(app)
      .patch(`/api/v1/orgs/${orgId}/fixtures/${fixtureId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ scheduledAt: '2026-04-15T19:30:00.000Z', status: 'scheduled' })
      .expect(200);

    const divisionFeed = await api(app)
      .get(`/api/v1/orgs/${orgId}/calendar/divisions/${division.id}.ics`)
      .set('Authorization', `Bearer ${token}`)
      .expect('Content-Type', /text\/calendar/)
      .expect(200);

    expect(divisionFeed.text).toContain('BEGIN:VCALENDAR');
    expect(divisionFeed.text).toContain(`UID:${fixtureId}@publeague`);
    expect(divisionFeed.text).toContain('SUMMARY:Team A vs Team B');
    expect(divisionFeed.text).toContain('DTSTART;TZID=Europe/London:20260415T203000');

    const teamFeed = await api(app)
      .get(`/api/v1/orgs/${orgId}/calendar/teams/${teamA.id}.ics`)
      .set('Authorization', `Bearer ${token}`)
      .expect('Content-Type', /text\/calendar/)
      .expect(200);

    expect(teamFeed.text).toContain(`UID:${fixtureId}@publeague`);
    expect(teamFeed.text).toContain('SUMMARY:Team A vs Team B');

    await api(app)
      .get(`/api/v1/orgs/${orgId}/calendar/teams/${teamB.id}.ics`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(403);

    await api(app)
      .patch(`/api/v1/orgs/${orgId}/fixtures/${fixtureId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ scheduledAt: '2026-04-16T19:30:00.000Z' })
      .expect(200);

    const updatedDivisionFeed = await api(app)
      .get(`/api/v1/orgs/${orgId}/calendar/divisions/${division.id}.ics`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(updatedDivisionFeed.text).toContain('DTSTART;TZID=Europe/London:20260416T203000');
  });
});
