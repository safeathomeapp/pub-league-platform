import { INestApplication } from '@nestjs/common';
import { api, bootstrapTestApp } from './test-utils';

describe('auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await bootstrapTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('register/login/me', async () => {
    const email = `user_${Date.now()}@example.com`;
    const password = 'password1234';

    const reg = await api(app).post('/api/v1/auth/register').send({ email, password }).expect(201);
    expect(reg.body.accessToken).toBeTruthy();

    const login = await api(app).post('/api/v1/auth/login').send({ email, password }).expect(201);
    const token = login.body.accessToken;

    const me = await api(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
    expect(me.body.user.email).toBe(email);
  });
});
