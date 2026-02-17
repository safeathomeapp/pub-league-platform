import { INestApplication } from '@nestjs/common';
import { api, bootstrapTestApp } from './test-utils';

describe('teams/players/rosters (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await bootstrapTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('create/list/update teams and players, then add/remove roster entries', async () => {
    const ownerEmail = `team_owner_${Date.now()}@example.com`;
    const otherEmail = `team_other_${Date.now()}@example.com`;
    const password = 'password1234';

    const ownerReg = await api(app).post('/api/v1/auth/register').send({ email: ownerEmail, password }).expect(201);
    const ownerToken = ownerReg.body.accessToken;

    const otherReg = await api(app).post('/api/v1/auth/register').send({ email: otherEmail, password }).expect(201);
    const otherToken = otherReg.body.accessToken;

    const ownerOrg = await api(app)
      .post('/api/v1/orgs')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Team Owner Org' })
      .expect(201);

    await api(app).post('/api/v1/orgs').set('Authorization', `Bearer ${otherToken}`).send({ name: 'Team Other Org' }).expect(201);

    const ruleset = await api(app)
      .post(`/api/v1/orgs/${ownerOrg.body.id}/rulesets`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Pool Ruleset',
        sport: 'pool',
        config: { frames_total: 10, allow_draw: false, points_model: { win: 2, loss: 0 } },
      })
      .expect(201);

    const league = await api(app)
      .post(`/api/v1/orgs/${ownerOrg.body.id}/leagues`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Main League', sport: 'pool', rulesetId: ruleset.body.id })
      .expect(201);

    const season = await api(app)
      .post(`/api/v1/orgs/${ownerOrg.body.id}/leagues/${league.body.id}/seasons`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Summer 2026',
        startDate: '2026-06-01T00:00:00.000Z',
        endDate: '2026-09-01T00:00:00.000Z',
      })
      .expect(201);

    const division = await api(app)
      .post(`/api/v1/orgs/${ownerOrg.body.id}/seasons/${season.body.id}/divisions`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Division A' })
      .expect(201);

    const team = await api(app)
      .post(`/api/v1/orgs/${ownerOrg.body.id}/divisions/${division.body.id}/teams`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'The Breakers' })
      .expect(201);
    const otherTeam = await api(app)
      .post(`/api/v1/orgs/${ownerOrg.body.id}/divisions/${division.body.id}/teams`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'The Chalkers' })
      .expect(201);

    expect(team.body.divisionId).toBe(division.body.id);

    const teams = await api(app)
      .get(`/api/v1/orgs/${ownerOrg.body.id}/divisions/${division.body.id}/teams`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(Array.isArray(teams.body)).toBe(true);
    expect(teams.body.length).toBeGreaterThanOrEqual(1);

    const updatedTeam = await api(app)
      .patch(`/api/v1/orgs/${ownerOrg.body.id}/teams/${team.body.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'The Cue Masters' })
      .expect(200);
    expect(updatedTeam.body.name).toBe('The Cue Masters');

    const player = await api(app)
      .post(`/api/v1/orgs/${ownerOrg.body.id}/players`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        displayName: 'Alice Carter',
        contactEmail: 'alice@example.com',
        contactPhone: '+447700900123',
      })
      .expect(201);
    expect(player.body.organisationId).toBe(ownerOrg.body.id);

    const players = await api(app)
      .get(`/api/v1/orgs/${ownerOrg.body.id}/players`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(Array.isArray(players.body)).toBe(true);
    expect(players.body.length).toBeGreaterThanOrEqual(1);

    const updatedPlayer = await api(app)
      .patch(`/api/v1/orgs/${ownerOrg.body.id}/players/${player.body.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ displayName: 'Alice C.' })
      .expect(200);
    expect(updatedPlayer.body.displayName).toBe('Alice C.');

    const rosterAdd = await api(app)
      .post(`/api/v1/orgs/${ownerOrg.body.id}/teams/${team.body.id}/players`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ playerId: player.body.id, role: 'PLAYER' })
      .expect(201);
    expect(rosterAdd.body.teamId).toBe(team.body.id);
    expect(rosterAdd.body.playerId).toBe(player.body.id);

    await api(app)
      .post(`/api/v1/orgs/${ownerOrg.body.id}/teams/${otherTeam.body.id}/players`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ playerId: player.body.id, role: 'PLAYER' })
      .expect(409);

    const rosterRemove = await api(app)
      .delete(`/api/v1/orgs/${ownerOrg.body.id}/teams/${team.body.id}/players/${player.body.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(rosterRemove.body.removed).toBe(true);

    await api(app)
      .get(`/api/v1/orgs/${ownerOrg.body.id}/players`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);
  });
});
