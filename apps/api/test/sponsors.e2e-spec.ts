import { INestApplication } from '@nestjs/common';
import { api, bootstrapTestApp } from './test-utils';

describe('sponsors (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await bootstrapTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('supports org-managed sponsor slots with scope filters and access control', async () => {
    const adminEmail = `sponsors_admin_${Date.now()}@example.com`;
    const captainEmail = `sponsors_captain_${Date.now()}@example.com`;
    const otherAdminEmail = `sponsors_other_admin_${Date.now()}@example.com`;
    const password = 'password1234';

    const adminReg = await api(app).post('/api/v1/auth/register').send({ email: adminEmail, password }).expect(201);
    const adminToken = adminReg.body.accessToken;
    const captainReg = await api(app).post('/api/v1/auth/register').send({ email: captainEmail, password }).expect(201);
    const captainToken = captainReg.body.accessToken;
    const otherReg = await api(app).post('/api/v1/auth/register').send({ email: otherAdminEmail, password }).expect(201);
    const otherToken = otherReg.body.accessToken;

    const orgA = await api(app).post('/api/v1/orgs').set('Authorization', `Bearer ${adminToken}`).send({ name: 'Sponsors Org A' }).expect(201);
    const orgAId = orgA.body.id as string;
    const orgB = await api(app).post('/api/v1/orgs').set('Authorization', `Bearer ${otherToken}`).send({ name: 'Sponsors Org B' }).expect(201);
    const orgBId = orgB.body.id as string;

    await api(app)
      .post(`/api/v1/orgs/${orgAId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: captainEmail, role: 'CAPTAIN' })
      .expect(201);

    const ruleset = await api(app)
      .post(`/api/v1/orgs/${orgAId}/rulesets`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Ruleset', sport: 'pool', config: {} })
      .expect(201);
    const league = await api(app)
      .post(`/api/v1/orgs/${orgAId}/leagues`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'League', sport: 'pool', rulesetId: ruleset.body.id })
      .expect(201);
    const season = await api(app)
      .post(`/api/v1/orgs/${orgAId}/leagues/${league.body.id}/seasons`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Season', startDate: '2026-01-01T00:00:00.000Z', endDate: '2026-12-31T00:00:00.000Z' })
      .expect(201);
    const division = await api(app)
      .post(`/api/v1/orgs/${orgAId}/seasons/${season.body.id}/divisions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Division A' })
      .expect(201);

    const created = await api(app)
      .post(`/api/v1/orgs/${orgAId}/sponsors`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        scopeType: 'ORG',
        title: 'Main Brand',
        imageUrl: 'https://cdn.example.com/sponsor-main.png',
        linkUrl: 'https://example.com',
        sortOrder: 1,
      })
      .expect(201);
    expect(created.body.organisationId).toBe(orgAId);

    await api(app)
      .post(`/api/v1/orgs/${orgAId}/sponsors`)
      .set('Authorization', `Bearer ${captainToken}`)
      .send({
        scopeType: 'ORG',
        imageUrl: 'https://cdn.example.com/blocked.png',
      })
      .expect(403);

    await api(app)
      .patch(`/api/v1/orgs/${orgAId}/sponsors/${created.body.id}`)
      .set('Authorization', `Bearer ${captainToken}`)
      .send({ title: 'Blocked edit' })
      .expect(403);

    await api(app)
      .delete(`/api/v1/orgs/${orgAId}/sponsors/${created.body.id}`)
      .set('Authorization', `Bearer ${captainToken}`)
      .expect(403);

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    await api(app)
      .post(`/api/v1/orgs/${orgAId}/sponsors`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        scopeType: 'LEAGUE',
        scopeId: league.body.id,
        title: 'League Sponsor Active',
        imageUrl: 'https://cdn.example.com/league-active.png',
        startAt: new Date(now - oneDay).toISOString(),
        endAt: new Date(now + oneDay).toISOString(),
      })
      .expect(201);

    await api(app)
      .post(`/api/v1/orgs/${orgAId}/sponsors`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        scopeType: 'LEAGUE',
        scopeId: league.body.id,
        title: 'League Sponsor Expired',
        imageUrl: 'https://cdn.example.com/league-expired.png',
        startAt: new Date(now - 5 * oneDay).toISOString(),
        endAt: new Date(now - oneDay).toISOString(),
      })
      .expect(201);

    await api(app)
      .post(`/api/v1/orgs/${orgAId}/sponsors`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        scopeType: 'DIVISION',
        scopeId: division.body.id,
        title: 'Division Sponsor Active',
        imageUrl: 'https://cdn.example.com/division-active.png',
      })
      .expect(201);

    await api(app)
      .post(`/api/v1/orgs/${orgBId}/sponsors`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({
        scopeType: 'ORG',
        title: 'Org B Sponsor',
        imageUrl: 'https://cdn.example.com/org-b.png',
      })
      .expect(201);

    const listLeague = await api(app)
      .get(`/api/v1/orgs/${orgAId}/sponsors?scopeType=LEAGUE&scopeId=${league.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(listLeague.body)).toBe(true);
    expect(listLeague.body.some((item: any) => item.title === 'League Sponsor Active')).toBe(true);
    expect(listLeague.body.some((item: any) => item.title === 'League Sponsor Expired')).toBe(false);
    expect(listLeague.body.every((item: any) => item.scopeType === 'LEAGUE')).toBe(true);

    const listDivision = await api(app)
      .get(`/api/v1/orgs/${orgAId}/sponsors?scopeType=DIVISION&scopeId=${division.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(listDivision.body.some((item: any) => item.title === 'Division Sponsor Active')).toBe(true);

    const listOrgBFromA = await api(app)
      .get(`/api/v1/orgs/${orgAId}/sponsors`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(listOrgBFromA.body.some((item: any) => item.title === 'Org B Sponsor')).toBe(false);

    await api(app)
      .patch(`/api/v1/orgs/${orgAId}/sponsors/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Main Brand Updated' })
      .expect(200);

    await api(app)
      .delete(`/api/v1/orgs/${orgAId}/sponsors/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });
});
