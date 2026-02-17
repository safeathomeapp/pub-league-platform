import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { api, bootstrapTestApp } from './test-utils';

describe('disputes (e2e)', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    app = await bootstrapTestApp();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('supports dispute lifecycle and recomputes standings on resolution', async () => {
    const ownerEmail = `disputes_owner_${Date.now()}@example.com`;
    const captainEmail = `disputes_captain_${Date.now()}@example.com`;
    const outsiderEmail = `disputes_outsider_${Date.now()}@example.com`;
    const password = 'password1234';

    const ownerReg = await api(app).post('/api/v1/auth/register').send({ email: ownerEmail, password }).expect(201);
    const ownerToken = ownerReg.body.accessToken;
    const captainReg = await api(app).post('/api/v1/auth/register').send({ email: captainEmail, password }).expect(201);
    const captainToken = captainReg.body.accessToken;
    const outsiderReg = await api(app).post('/api/v1/auth/register').send({ email: outsiderEmail, password }).expect(201);
    const outsiderToken = outsiderReg.body.accessToken;

    const org = await api(app).post('/api/v1/orgs').set('Authorization', `Bearer ${ownerToken}`).send({ name: 'Disputes Org' }).expect(201);
    const orgId = org.body.id as string;
    await api(app).post('/api/v1/orgs').set('Authorization', `Bearer ${outsiderToken}`).send({ name: 'Other Org' }).expect(201);

    await api(app)
      .post(`/api/v1/orgs/${orgId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: captainEmail, role: 'CAPTAIN' })
      .expect(201);

    const ruleset = await api(app)
      .post(`/api/v1/orgs/${orgId}/rulesets`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Pool Ruleset',
        sport: 'pool',
        config: { points_model: { win: 2, draw: 1, loss: 0 } },
      })
      .expect(201);

    const league = await api(app)
      .post(`/api/v1/orgs/${orgId}/leagues`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'League', sport: 'pool', rulesetId: ruleset.body.id })
      .expect(201);

    const season = await api(app)
      .post(`/api/v1/orgs/${orgId}/leagues/${league.body.id}/seasons`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Season',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-12-31T00:00:00.000Z',
      })
      .expect(201);

    const division = await api(app)
      .post(`/api/v1/orgs/${orgId}/seasons/${season.body.id}/divisions`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Division A' })
      .expect(201);

    await api(app).post(`/api/v1/orgs/${orgId}/divisions/${division.body.id}/teams`).set('Authorization', `Bearer ${ownerToken}`).send({ name: 'Team A' }).expect(201);
    await api(app).post(`/api/v1/orgs/${orgId}/divisions/${division.body.id}/teams`).set('Authorization', `Bearer ${ownerToken}`).send({ name: 'Team B' }).expect(201);

    await api(app)
      .post(`/api/v1/orgs/${orgId}/divisions/${division.body.id}/fixtures:generate`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(201);

    const fixtures = await api(app)
      .get(`/api/v1/orgs/${orgId}/divisions/${division.body.id}/fixtures`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    const fixtureId = fixtures.body[0].id as string;

    await api(app)
      .post(`/api/v1/orgs/${orgId}/fixtures/${fixtureId}/complete`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ expectedRevision: 0, homeFrames: 7, awayFrames: 5 })
      .expect(201);

    const snapshotCountBefore = await prisma.standingsSnapshot.count({
      where: { divisionId: division.body.id },
    });

    const created = await api(app)
      .post(`/api/v1/orgs/${orgId}/fixtures/${fixtureId}/disputes`)
      .set('Authorization', `Bearer ${captainToken}`)
      .send({ reason: 'Wrong frame attribution in round 3' })
      .expect(201);
    expect(created.body.status).toBe('open');

    const listed = await api(app)
      .get(`/api/v1/orgs/${orgId}/fixtures/${fixtureId}/disputes`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(Array.isArray(listed.body)).toBe(true);
    expect(listed.body.some((dispute: any) => dispute.id === created.body.id)).toBe(true);

    const resolved = await api(app)
      .patch(`/api/v1/orgs/${orgId}/disputes/${created.body.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'resolved', outcome: 'Score confirmed after review' })
      .expect(200);
    expect(resolved.body.status).toBe('resolved');
    expect(resolved.body.outcome).toBe('Score confirmed after review');

    const fixtureAfterResolution = await api(app)
      .get(`/api/v1/orgs/${orgId}/fixtures/${fixtureId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(fixtureAfterResolution.body.state).toBe('LOCKED');

    const snapshotCountAfter = await prisma.standingsSnapshot.count({
      where: { divisionId: division.body.id },
    });
    expect(snapshotCountAfter).toBeGreaterThan(snapshotCountBefore);

    const events = await api(app)
      .get(`/api/v1/orgs/${orgId}/fixtures/${fixtureId}/events`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    const eventTypes = events.body.map((event: any) => event.eventType);
    expect(eventTypes).toContain('DISPUTE_OPENED');
    expect(eventTypes).toContain('DISPUTE_RESOLVED');

    await api(app)
      .get(`/api/v1/orgs/${orgId}/fixtures/${fixtureId}/disputes`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(403);
  });
});
