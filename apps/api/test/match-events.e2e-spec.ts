import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { api, bootstrapTestApp } from './test-utils';

describe('match-events (e2e)', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    app = await bootstrapTestApp();
  });

  afterAll(async () => {
    await prisma.$disconnect();
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
        reason: 'Admin lock override for verified score',
      })
      .expect(201);

    expect(completed.body.state).toBe('LOCKED');

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

  it('supports captain submit + opponent sign-off transitions with permission checks', async () => {
    const ownerEmail = `workflow_owner_${Date.now()}@example.com`;
    const holderAEmail = `workflow_holder_a_${Date.now()}@example.com`;
    const holderBEmail = `workflow_holder_b_${Date.now()}@example.com`;
    const outsiderEmail = `workflow_outsider_${Date.now()}@example.com`;
    const password = 'password1234';

    const ownerReg = await api(app).post('/api/v1/auth/register').send({ email: ownerEmail, password }).expect(201);
    const ownerToken = ownerReg.body.accessToken;
    const holderAReg = await api(app).post('/api/v1/auth/register').send({ email: holderAEmail, password }).expect(201);
    const holderAToken = holderAReg.body.accessToken;
    const holderBReg = await api(app).post('/api/v1/auth/register').send({ email: holderBEmail, password }).expect(201);
    const holderBToken = holderBReg.body.accessToken;
    const outsiderReg = await api(app).post('/api/v1/auth/register').send({ email: outsiderEmail, password }).expect(201);
    const outsiderToken = outsiderReg.body.accessToken;

    const org = await api(app)
      .post('/api/v1/orgs')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Workflow Org' })
      .expect(201);
    const orgId = org.body.id as string;

    await api(app)
      .post(`/api/v1/orgs/${orgId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: holderAEmail, role: 'CAPTAIN' })
      .expect(201);
    await api(app)
      .post(`/api/v1/orgs/${orgId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: holderBEmail, role: 'CAPTAIN' })
      .expect(201);
    await api(app)
      .post(`/api/v1/orgs/${orgId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: outsiderEmail, role: 'PLAYER' })
      .expect(201);

    const ruleset = await api(app)
      .post(`/api/v1/orgs/${orgId}/rulesets`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Workflow Ruleset',
        sport: 'pool',
        config: { frames_total: 10, allow_draw: false, points_model: { win: 2, loss: 0 } },
      })
      .expect(201);

    const league = await api(app)
      .post(`/api/v1/orgs/${orgId}/leagues`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Workflow League', sport: 'pool', rulesetId: ruleset.body.id })
      .expect(201);

    const season = await api(app)
      .post(`/api/v1/orgs/${orgId}/leagues/${league.body.id}/seasons`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Workflow Season',
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
    const teamB = await api(app)
      .post(`/api/v1/orgs/${orgId}/divisions/${division.body.id}/teams`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Team B' })
      .expect(201);

    const playerA = await api(app)
      .post(`/api/v1/orgs/${orgId}/players`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ displayName: 'Holder A', contactEmail: `holder_a_player_${Date.now()}@example.com` })
      .expect(201);
    const playerB = await api(app)
      .post(`/api/v1/orgs/${orgId}/players`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ displayName: 'Holder B', contactEmail: `holder_b_player_${Date.now()}@example.com` })
      .expect(201);
    const outsiderPlayer = await api(app)
      .post(`/api/v1/orgs/${orgId}/players`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ displayName: 'Outsider Player', contactEmail: `outsider_player_${Date.now()}@example.com` })
      .expect(201);

    await api(app)
      .post(`/api/v1/orgs/${orgId}/teams/${teamA.body.id}/players`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ playerId: playerA.body.id, role: 'CAPTAIN' })
      .expect(201);
    await api(app)
      .post(`/api/v1/orgs/${orgId}/teams/${teamB.body.id}/players`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ playerId: playerB.body.id, role: 'CAPTAIN' })
      .expect(201);

    await api(app)
      .post(`/api/v1/orgs/${orgId}/divisions/${division.body.id}/fixtures:generate`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(201);

    const fixtures = await api(app)
      .get(`/api/v1/orgs/${orgId}/divisions/${division.body.id}/fixtures`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    const fixtureOneId = fixtures.body[0].id as string;
    const fixtureTwo = await prisma.fixture.create({
      data: {
        divisionId: division.body.id,
        homeTeamId: teamA.body.id,
        awayTeamId: teamB.body.id,
      },
    });
    const fixtureTwoId = fixtureTwo.id;

    for (const fixtureId of [fixtureOneId, fixtureTwoId]) {
      await api(app)
        .post(`/api/v1/orgs/${orgId}/fixtures/${fixtureId}/tokens:issue`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ teamId: teamA.body.id, holderPlayerId: playerA.body.id })
        .expect(201);
      await api(app)
        .post(`/api/v1/orgs/${orgId}/fixtures/${fixtureId}/tokens:issue`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ teamId: teamB.body.id, holderPlayerId: playerB.body.id })
        .expect(201);
    }

    const submitted = await api(app)
      .post(`/api/v1/orgs/${orgId}/fixtures/${fixtureOneId}/submit`)
      .set('Authorization', `Bearer ${holderAToken}`)
      .send({
        expectedRevision: 2,
        homeFrames: 7,
        awayFrames: 4,
        teamId: teamA.body.id,
        actorPlayerId: playerA.body.id,
      })
      .expect(201);
    expect(submitted.body.state).toBe('AWAITING_OPPONENT');

    const approved = await api(app)
      .post(`/api/v1/orgs/${orgId}/fixtures/${fixtureOneId}/approve`)
      .set('Authorization', `Bearer ${holderBToken}`)
      .send({
        expectedRevision: 4,
        teamId: teamB.body.id,
        actorPlayerId: playerB.body.id,
      })
      .expect(201);
    expect(approved.body.state).toBe('LOCKED');

    await api(app)
      .post(`/api/v1/orgs/${orgId}/fixtures/${fixtureOneId}/approve`)
      .set('Authorization', `Bearer ${holderBToken}`)
      .send({
        expectedRevision: 6,
        teamId: teamB.body.id,
        actorPlayerId: playerB.body.id,
      })
      .expect(409);

    await api(app)
      .post(`/api/v1/orgs/${orgId}/fixtures/${fixtureTwoId}/complete`)
      .set('Authorization', `Bearer ${holderAToken}`)
      .send({
        expectedRevision: 2,
        homeFrames: 9,
        awayFrames: 1,
        reason: 'Attempted bypass',
      })
      .expect(403);

    await api(app)
      .post(`/api/v1/orgs/${orgId}/fixtures/${fixtureTwoId}/submit`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({
        expectedRevision: 2,
        homeFrames: 6,
        awayFrames: 5,
        teamId: teamA.body.id,
        actorPlayerId: outsiderPlayer.body.id,
      })
      .expect(403);

    await api(app)
      .post(`/api/v1/orgs/${orgId}/fixtures/${fixtureTwoId}/submit`)
      .set('Authorization', `Bearer ${holderAToken}`)
      .send({
        expectedRevision: 2,
        homeFrames: 6,
        awayFrames: 5,
        teamId: teamA.body.id,
        actorPlayerId: playerA.body.id,
      })
      .expect(201);

    await api(app)
      .post(`/api/v1/orgs/${orgId}/fixtures/${fixtureTwoId}/approve`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({
        expectedRevision: 4,
        teamId: teamB.body.id,
        actorPlayerId: outsiderPlayer.body.id,
      })
      .expect(403);

    const rejected = await api(app)
      .post(`/api/v1/orgs/${orgId}/fixtures/${fixtureTwoId}/reject`)
      .set('Authorization', `Bearer ${holderBToken}`)
      .send({
        expectedRevision: 4,
        teamId: teamB.body.id,
        actorPlayerId: playerB.body.id,
        reason: 'Opponent does not accept score',
      })
      .expect(201);
    expect(rejected.body.state).toBe('DISPUTED');
  });
});
