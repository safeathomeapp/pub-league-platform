import { INestApplication } from '@nestjs/common';
import { api, bootstrapTestApp } from './test-utils';

describe('export (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await bootstrapTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns org-scoped backup export package', async () => {
    const ownerEmail = `export_owner_${Date.now()}@example.com`;
    const outsiderEmail = `export_outsider_${Date.now()}@example.com`;
    const password = 'password1234';

    const ownerReg = await api(app).post('/api/v1/auth/register').send({ email: ownerEmail, password }).expect(201);
    const ownerToken = ownerReg.body.accessToken;
    const outsiderReg = await api(app).post('/api/v1/auth/register').send({ email: outsiderEmail, password }).expect(201);
    const outsiderToken = outsiderReg.body.accessToken;

    const org = await api(app).post('/api/v1/orgs').set('Authorization', `Bearer ${ownerToken}`).send({ name: 'Export Org' }).expect(201);
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

    await api(app)
      .post(`/api/v1/orgs/${orgId}/fixtures/${fixtureId}/disputes`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ reason: 'Export data check' })
      .expect(201);

    await api(app)
      .post(`/api/v1/orgs/${orgId}/notifications/test`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ channel: 'sms', to: '+447700900009', message: 'Export coverage ping' })
      .expect(201);

    const exported = await api(app)
      .get(`/api/v1/orgs/${orgId}/export`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(exported.body.formatVersion).toBe(1);
    expect(exported.body.organisation.id).toBe(orgId);
    expect(Array.isArray(exported.body.rulesets)).toBe(true);
    expect(Array.isArray(exported.body.leagues)).toBe(true);
    expect(Array.isArray(exported.body.fixtures)).toBe(true);
    expect(Array.isArray(exported.body.matchEventLog)).toBe(true);
    expect(Array.isArray(exported.body.standingsSnapshots)).toBe(true);
    expect(Array.isArray(exported.body.notificationsOutbox)).toBe(true);
    expect(Array.isArray(exported.body.disputes)).toBe(true);
    expect(exported.body.fixtures.length).toBeGreaterThanOrEqual(1);
    expect(exported.body.matchEventLog.length).toBeGreaterThanOrEqual(1);
    expect(exported.body.notificationsOutbox.length).toBeGreaterThanOrEqual(1);

    await api(app)
      .get(`/api/v1/orgs/${orgId}/export`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(403);
  });
});
