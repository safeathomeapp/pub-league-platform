import { INestApplication } from '@nestjs/common';
import { api, bootstrapTestApp } from './test-utils';

describe('tokens (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await bootstrapTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('issues, transfers, accepts, and lists fixture control tokens', async () => {
    const ownerEmail = `tokens_owner_${Date.now()}@example.com`;
    const outsiderEmail = `tokens_outsider_${Date.now()}@example.com`;
    const password = 'password1234';

    const ownerReg = await api(app).post('/api/v1/auth/register').send({ email: ownerEmail, password }).expect(201);
    const ownerToken = ownerReg.body.accessToken;
    const outsiderReg = await api(app).post('/api/v1/auth/register').send({ email: outsiderEmail, password }).expect(201);
    const outsiderToken = outsiderReg.body.accessToken;

    const org = await api(app).post('/api/v1/orgs').set('Authorization', `Bearer ${ownerToken}`).send({ name: 'Token Org' }).expect(201);
    const orgId = org.body.id as string;

    await api(app).post('/api/v1/orgs').set('Authorization', `Bearer ${outsiderToken}`).send({ name: 'Other Org' }).expect(201);

    const ruleset = await api(app)
      .post(`/api/v1/orgs/${orgId}/rulesets`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Pool Ruleset',
        sport: 'pool',
        config: { frames_total: 10, allow_draw: false, points_model: { win: 2, loss: 0 } },
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
    await api(app)
      .post(`/api/v1/orgs/${orgId}/divisions/${division.body.id}/teams`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Team B' })
      .expect(201);

    const playerOne = await api(app)
      .post(`/api/v1/orgs/${orgId}/players`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ displayName: 'Player One', contactEmail: 'one@example.com' })
      .expect(201);
    const playerTwo = await api(app)
      .post(`/api/v1/orgs/${orgId}/players`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ displayName: 'Player Two', contactEmail: 'two@example.com' })
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

    const issued = await api(app)
      .post(`/api/v1/orgs/${orgId}/fixtures/${fixtureId}/tokens:issue`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ teamId: teamA.body.id, holderPlayerId: playerOne.body.id })
      .expect(201);
    expect(issued.body.currentHolderPlayerId).toBe(playerOne.body.id);
    expect(issued.body.acceptedAt).toBeTruthy();

    const transferred = await api(app)
      .post(`/api/v1/orgs/${orgId}/fixtures/${fixtureId}/tokens:transfer`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ teamId: teamA.body.id, toPlayerId: playerTwo.body.id })
      .expect(201);
    expect(transferred.body.currentHolderPlayerId).toBe(playerTwo.body.id);
    expect(transferred.body.acceptedAt).toBeNull();

    await api(app)
      .post(`/api/v1/orgs/${orgId}/fixtures/${fixtureId}/tokens:accept`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ teamId: teamA.body.id, playerId: playerOne.body.id })
      .expect(403);

    const accepted = await api(app)
      .post(`/api/v1/orgs/${orgId}/fixtures/${fixtureId}/tokens:accept`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ teamId: teamA.body.id, playerId: playerTwo.body.id })
      .expect(201);
    expect(accepted.body.currentHolderPlayerId).toBe(playerTwo.body.id);
    expect(accepted.body.acceptedAt).toBeTruthy();

    const listed = await api(app)
      .get(`/api/v1/orgs/${orgId}/fixtures/${fixtureId}/tokens`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(Array.isArray(listed.body)).toBe(true);
    expect(listed.body.length).toBeGreaterThanOrEqual(1);

    await api(app)
      .get(`/api/v1/orgs/${orgId}/fixtures/${fixtureId}/tokens`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(403);
  });
});
