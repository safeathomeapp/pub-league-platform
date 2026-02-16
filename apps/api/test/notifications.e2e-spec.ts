import { INestApplication } from '@nestjs/common';
import { api, bootstrapTestApp } from './test-utils';

describe('notifications (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await bootstrapTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('queues fixture change/reminder/completed notifications and supports outbox admin endpoints', async () => {
    const ownerEmail = `notifications_owner_${Date.now()}@example.com`;
    const outsiderEmail = `notifications_outsider_${Date.now()}@example.com`;
    const password = 'password1234';

    const ownerReg = await api(app).post('/api/v1/auth/register').send({ email: ownerEmail, password }).expect(201);
    const ownerToken = ownerReg.body.accessToken;
    const outsiderReg = await api(app).post('/api/v1/auth/register').send({ email: outsiderEmail, password }).expect(201);
    const outsiderToken = outsiderReg.body.accessToken;

    const org = await api(app).post('/api/v1/orgs').set('Authorization', `Bearer ${ownerToken}`).send({ name: 'Notify Org' }).expect(201);
    const orgId = org.body.id as string;
    await api(app).post('/api/v1/orgs').set('Authorization', `Bearer ${outsiderToken}`).send({ name: 'Other Org' }).expect(201);

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

    const teamA = await api(app)
      .post(`/api/v1/orgs/${orgId}/divisions/${division.body.id}/teams`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Team A' })
      .expect(201);
    const teamB = await api(app)
      .post(`/api/v1/orgs/${orgId}/divisions/${division.body.id}/teams`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Team B' })
      .expect(201);

    const captainA = await api(app)
      .post(`/api/v1/orgs/${orgId}/players`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ displayName: 'Captain A', contactPhone: '+447700900001' })
      .expect(201);
    const captainB = await api(app)
      .post(`/api/v1/orgs/${orgId}/players`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ displayName: 'Captain B', contactPhone: '+447700900002' })
      .expect(201);

    await api(app)
      .post(`/api/v1/orgs/${orgId}/teams/${teamA.body.id}/players`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ playerId: captainA.body.id, role: 'CAPTAIN' })
      .expect(201);
    await api(app)
      .post(`/api/v1/orgs/${orgId}/teams/${teamB.body.id}/players`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ playerId: captainB.body.id, role: 'CAPTAIN' })
      .expect(201);

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
      .patch(`/api/v1/orgs/${orgId}/fixtures/${fixtureId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ scheduledAt: '2026-07-20T19:30:00.000Z', status: 'scheduled' })
      .expect(200);

    await api(app)
      .post(`/api/v1/orgs/${orgId}/fixtures/${fixtureId}/complete`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ expectedRevision: 0, homeFrames: 7, awayFrames: 5 })
      .expect(201);

    const outbox = await api(app)
      .get(`/api/v1/orgs/${orgId}/notifications/outbox`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    const templateKeys = outbox.body.map((item: any) => item.templateKey);
    expect(templateKeys).toContain('fixture.changed');
    expect(templateKeys).toContain('fixture.reminder');
    expect(templateKeys).toContain('fixture.completed');

    const completedOnly = await api(app)
      .get(`/api/v1/orgs/${orgId}/notifications/outbox?templateKey=fixture.completed`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(completedOnly.body.length).toBeGreaterThanOrEqual(2);
    expect(completedOnly.body.every((item: any) => item.templateKey === 'fixture.completed')).toBe(true);

    const pendingOnly = await api(app)
      .get(`/api/v1/orgs/${orgId}/notifications/outbox?status=pending&channel=sms`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(pendingOnly.body.length).toBeGreaterThanOrEqual(1);
    expect(pendingOnly.body.every((item: any) => item.status === 'pending')).toBe(true);

    const testQueued = await api(app)
      .post(`/api/v1/orgs/${orgId}/notifications/test`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ channel: 'sms', to: '+447700900009', message: 'Diagnostics ping' })
      .expect(201);
    expect(testQueued.body.templateKey).toBe('notifications.test');
    expect(testQueued.body.status).toBe('pending');

    await api(app)
      .get(`/api/v1/orgs/${orgId}/notifications/outbox`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(403);
  });
});
