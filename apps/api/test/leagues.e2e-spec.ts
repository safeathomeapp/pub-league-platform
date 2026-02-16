import { INestApplication } from '@nestjs/common';
import { api, bootstrapTestApp } from './test-utils';

describe('leagues (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await bootstrapTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('create/list/get/update leagues with org scoping', async () => {
    const ownerEmail = `leagues_owner_${Date.now()}@example.com`;
    const otherEmail = `leagues_other_${Date.now()}@example.com`;
    const password = 'password1234';

    const ownerReg = await api(app).post('/api/v1/auth/register').send({ email: ownerEmail, password }).expect(201);
    const ownerToken = ownerReg.body.accessToken;

    const otherReg = await api(app).post('/api/v1/auth/register').send({ email: otherEmail, password }).expect(201);
    const otherToken = otherReg.body.accessToken;

    const ownerOrg = await api(app)
      .post('/api/v1/orgs')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'League Owner Org' })
      .expect(201);

    await api(app).post('/api/v1/orgs').set('Authorization', `Bearer ${otherToken}`).send({ name: 'League Other Org' }).expect(201);

    const ruleset = await api(app)
      .post(`/api/v1/orgs/${ownerOrg.body.id}/rulesets`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Pool Ruleset',
        sport: 'pool',
        config: { frames_total: 10, allow_draw: false, points_model: { win: 2, loss: 0 } },
      })
      .expect(201);

    const created = await api(app)
      .post(`/api/v1/orgs/${ownerOrg.body.id}/leagues`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Monday League',
        sport: 'pool',
        rulesetId: ruleset.body.id,
      })
      .expect(201);

    expect(created.body.name).toBe('Monday League');
    expect(created.body.rulesetId).toBe(ruleset.body.id);

    const list = await api(app)
      .get(`/api/v1/orgs/${ownerOrg.body.id}/leagues`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body.length).toBeGreaterThanOrEqual(1);

    const found = await api(app)
      .get(`/api/v1/orgs/${ownerOrg.body.id}/leagues/${created.body.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(found.body.id).toBe(created.body.id);
    expect(found.body.ruleset.id).toBe(ruleset.body.id);

    const updated = await api(app)
      .patch(`/api/v1/orgs/${ownerOrg.body.id}/leagues/${created.body.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Tuesday League' })
      .expect(200);

    expect(updated.body.name).toBe('Tuesday League');

    await api(app)
      .get(`/api/v1/orgs/${ownerOrg.body.id}/leagues`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);
  });
});
