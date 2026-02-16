import { INestApplication } from '@nestjs/common';
import { api, bootstrapTestApp } from './test-utils';

describe('match-events (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await bootstrapTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('appends/lists events with revision checks and supports complete endpoint', async () => {
    const ownerEmail = `events_owner_${Date.now()}@example.com`;
    const playerUserEmail = `events_player_${Date.now()}@example.com`;
    const outsiderEmail = `events_outsider_${Date.now()}@example.com`;
    const password = 'password1234';

    const ownerReg = await api(app).post('/api/v1/auth/register').send({ email: ownerEmail, password }).expect(201);
    const ownerToken = ownerReg.body.accessToken;
    await api(app).post('/api/v1/auth/register').send({ email: playerUserEmail, password }).expect(201);
    const outsiderReg = await api(app).post('/api/v1/auth/register').send({ email: outsiderEmail, password }).expect(201);
    const outsiderToken = outsiderReg.body.accessToken;

    const org = await api(app)
      .post('/api/v1/orgs')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Events Org' })
      .expect(201);
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
      .post(`/api/v1/orgs/${orgId}/fixtures/${fixtureId}/events`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        eventType: 'FRAME_RECORDED',
        expectedRevision: 0,
        payload: { frame_no: 1, winner_team_id: teamA.body.id },
      })
      .expect(201);

    await api(app)
      .post(`/api/v1/orgs/${orgId}/fixtures/${fixtureId}/events`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        eventType: 'FRAME_RECORDED',
        expectedRevision: 0,
        payload: { frame_no: 2, winner_team_id: teamA.body.id },
      })
      .expect(409);

    const events = await api(app)
      .get(`/api/v1/orgs/${orgId}/fixtures/${fixtureId}/events`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(Array.isArray(events.body)).toBe(true);
    expect(events.body).toHaveLength(1);
    expect(events.body[0].revision).toBe(1);

    const completed = await api(app)
      .post(`/api/v1/orgs/${orgId}/fixtures/${fixtureId}/complete`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        expectedRevision: 1,
        homeFrames: 7,
        awayFrames: 3,
      })
      .expect(201);

    expect(completed.body.revision).toBe(2);
    expect(completed.body.eventType).toBe('MATCH_COMPLETED');

    const fixture = await api(app)
      .get(`/api/v1/orgs/${orgId}/fixtures/${fixtureId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(fixture.body.status).toBe('completed');

    await api(app)
      .get(`/api/v1/orgs/${orgId}/fixtures/${fixtureId}/events`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(403);

    // Player-role user without accepted token cannot write ledger events.
    const playerUserLogin = await api(app).post('/api/v1/auth/login').send({ email: playerUserEmail, password }).expect(201);
    const playerUserToken = playerUserLogin.body.accessToken;

    await api(app)
      .post(`/api/v1/orgs/${orgId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: playerUserEmail, role: 'PLAYER' })
      .expect(201);

    await api(app)
      .post(`/api/v1/orgs/${orgId}/fixtures/${fixtureId}/events`)
      .set('Authorization', `Bearer ${playerUserToken}`)
      .send({
        eventType: 'MATCH_EDITED',
        expectedRevision: 2,
        payload: { reason: 'Attempt without token' },
        teamId: teamA.body.id,
        actorPlayerId: playerOne.body.id,
      })
      .expect(403);
  });
});
