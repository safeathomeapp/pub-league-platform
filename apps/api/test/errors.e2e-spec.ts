import { INestApplication } from '@nestjs/common';
import { api, bootstrapTestApp } from './test-utils';

describe('errors (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await bootstrapTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns standardized error codes and shape', async () => {
    const unauth = await api(app).get('/api/v1/orgs').expect(401);
    expect(unauth.body.error.code).toBe('AUTH_UNAUTHORIZED');
    expect(typeof unauth.body.error.message).toBe('string');
    expect(typeof unauth.body.error.path).toBe('string');

    const invalid = await api(app)
      .post('/api/v1/auth/register')
      .send({ email: 'invalid', password: 'short' })
      .expect(400);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');
    expect(typeof invalid.body.error.message).toBe('string');
    expect(Array.isArray(invalid.body.error.details.message)).toBe(true);

    const email = `errors_${Date.now()}@example.com`;
    const password = 'password1234';
    await api(app).post('/api/v1/auth/register').send({ email, password }).expect(201);
    const conflict = await api(app).post('/api/v1/auth/register').send({ email, password }).expect(409);
    expect(conflict.body.error.code).toBe('CONFLICT');
  });
});
