import { INestApplication } from '@nestjs/common';
import { api, bootstrapTestApp } from './test-utils';

describe('orgs (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await bootstrapTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('create/list/get org', async () => {
    const email = `org_${Date.now()}@example.com`;
    const password = 'password1234';

    const reg = await api(app).post('/api/v1/auth/register').send({ email, password }).expect(201);
    const token = reg.body.accessToken;

    const created = await api(app).post('/api/v1/orgs').set('Authorization', `Bearer ${token}`).send({ name: 'Test Org' }).expect(201);
    const orgId = created.body.id;

    const list = await api(app).get('/api/v1/orgs').set('Authorization', `Bearer ${token}`).expect(200);
    expect(Array.isArray(list.body)).toBe(true);

    await api(app).get(`/api/v1/orgs/${orgId}`).set('Authorization', `Bearer ${token}`).expect(200);
  });
});
