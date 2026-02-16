import { INestApplication } from '@nestjs/common';
import { api, bootstrapTestApp } from './test-utils';

describe('memberships (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await bootstrapTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('add/list/update member role', async () => {
    const emailA = `admin_${Date.now()}@example.com`;
    const emailB = `member_${Date.now()}@example.com`;
    const password = 'password1234';

    const regA = await api(app).post('/api/v1/auth/register').send({ email: emailA, password }).expect(201);
    const tokenA = regA.body.accessToken;

    await api(app).post('/api/v1/auth/register').send({ email: emailB, password }).expect(201);

    const org = await api(app).post('/api/v1/orgs').set('Authorization', `Bearer ${tokenA}`).send({ name: 'Org' }).expect(201);

    const add = await api(app)
      .post(`/api/v1/orgs/${org.body.id}/members`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ email: emailB, role: 'COMMISSIONER' })
      .expect(201);

    const list = await api(app).get(`/api/v1/orgs/${org.body.id}/members`).set('Authorization', `Bearer ${tokenA}`).expect(200);
    expect(list.body.length).toBeGreaterThanOrEqual(1);

    const updated = await api(app)
      .patch(`/api/v1/orgs/${org.body.id}/members/${add.body.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ role: 'PLAYER' })
      .expect(200);

    expect(updated.body.role).toBe('PLAYER');
  });
});
