import { INestApplication } from '@nestjs/common';
import { api, bootstrapTestApp } from './test-utils';

describe('seasons/divisions (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await bootstrapTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('create/list seasons and divisions with org scoping', async () => {
    const ownerEmail = `seasons_owner_${Date.now()}@example.com`;
    const otherEmail = `seasons_other_${Date.now()}@example.com`;
    const password = 'password1234';

    const ownerReg = await api(app).post('/api/v1/auth/register').send({ email: ownerEmail, password }).expect(201);
    const ownerToken = ownerReg.body.accessToken;

    const otherReg = await api(app).post('/api/v1/auth/register').send({ email: otherEmail, password }).expect(201);
    const otherToken = otherReg.body.accessToken;

    const ownerOrg = await api(app)
      .post('/api/v1/orgs')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Seasons Owner Org' })
      .expect(201);

    await api(app).post('/api/v1/orgs').set('Authorization', `Bearer ${otherToken}`).send({ name: 'Seasons Other Org' }).expect(201);

    const ruleset = await api(app)
      .post(`/api/v1/orgs/${ownerOrg.body.id}/rulesets`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Pool Ruleset',
        sport: 'pool',
        config: { frames_total: 10, allow_draw: false, points_model: { win: 2, loss: 0 } },
      })
      .expect(201);

    const league = await api(app)
      .post(`/api/v1/orgs/${ownerOrg.body.id}/leagues`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Main League',
        sport: 'pool',
        rulesetId: ruleset.body.id,
      })
      .expect(201);

    const season = await api(app)
      .post(`/api/v1/orgs/${ownerOrg.body.id}/leagues/${league.body.id}/seasons`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Spring 2026',
        startDate: '2026-03-01T00:00:00.000Z',
        endDate: '2026-06-30T00:00:00.000Z',
      })
      .expect(201);

    expect(season.body.leagueId).toBe(league.body.id);

    const seasons = await api(app)
      .get(`/api/v1/orgs/${ownerOrg.body.id}/leagues/${league.body.id}/seasons`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(Array.isArray(seasons.body)).toBe(true);
    expect(seasons.body.length).toBeGreaterThanOrEqual(1);

    const division = await api(app)
      .post(`/api/v1/orgs/${ownerOrg.body.id}/seasons/${season.body.id}/divisions`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Division A' })
      .expect(201);

    expect(division.body.seasonId).toBe(season.body.id);

    const divisions = await api(app)
      .get(`/api/v1/orgs/${ownerOrg.body.id}/seasons/${season.body.id}/divisions`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(Array.isArray(divisions.body)).toBe(true);
    expect(divisions.body.length).toBeGreaterThanOrEqual(1);

    await api(app)
      .get(`/api/v1/orgs/${ownerOrg.body.id}/leagues/${league.body.id}/seasons`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);
  });
});
