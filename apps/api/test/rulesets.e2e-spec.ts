import { INestApplication } from '@nestjs/common';
import { api, bootstrapTestApp } from './test-utils';

describe('rulesets (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await bootstrapTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('create/list/get/update rulesets with org scoping', async () => {
    const ownerEmail = `rulesets_owner_${Date.now()}@example.com`;
    const otherEmail = `rulesets_other_${Date.now()}@example.com`;
    const password = 'password1234';

    const ownerReg = await api(app).post('/api/v1/auth/register').send({ email: ownerEmail, password }).expect(201);
    const ownerToken = ownerReg.body.accessToken;

    const otherReg = await api(app).post('/api/v1/auth/register').send({ email: otherEmail, password }).expect(201);
    const otherToken = otherReg.body.accessToken;

    const ownerOrg = await api(app)
      .post('/api/v1/orgs')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Owner Org' })
      .expect(201);

    // Separate org proves tenant isolation on ruleset routes.
    await api(app).post('/api/v1/orgs').set('Authorization', `Bearer ${otherToken}`).send({ name: 'Other Org' }).expect(201);

    const created = await api(app)
      .post(`/api/v1/orgs/${ownerOrg.body.id}/rulesets`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'English 8-ball',
        sport: 'pool',
        config: {
          frames_total: 10,
          allow_draw: false,
          points_model: { win: 2, loss: 0 },
        },
      })
      .expect(201);

    expect(created.body.name).toBe('English 8-ball');
    expect(created.body.sport).toBe('pool');

    const list = await api(app)
      .get(`/api/v1/orgs/${ownerOrg.body.id}/rulesets`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body.length).toBeGreaterThanOrEqual(1);

    await api(app)
      .get(`/api/v1/orgs/${ownerOrg.body.id}/rulesets/${created.body.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    const updated = await api(app)
      .patch(`/api/v1/orgs/${ownerOrg.body.id}/rulesets/${created.body.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'English 8-ball Updated',
        config: {
          frames_total: 12,
          allow_draw: false,
          points_model: { win: 3, loss: 0 },
        },
      })
      .expect(200);

    expect(updated.body.name).toBe('English 8-ball Updated');
    expect(updated.body.config.frames_total).toBe(12);

    await api(app)
      .get(`/api/v1/orgs/${ownerOrg.body.id}/rulesets`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);
  });
});
