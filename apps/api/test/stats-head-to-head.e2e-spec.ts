import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { api, bootstrapTestApp } from './test-utils';

describe('stats head-to-head (e2e)', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    app = await bootstrapTestApp();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  async function setupLeagueSeason(
    ownerToken: string,
    orgId: string,
    suffix: string,
    playerAId?: string,
    playerBId?: string,
  ) {
    const ruleset = await api(app)
      .post(`/api/v1/orgs/${orgId}/rulesets`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: `Ruleset ${suffix}`,
        sport: 'pool',
        config: { points_model: { win: 2, draw: 1, loss: 0 } },
      })
      .expect(201);

    const league = await api(app)
      .post(`/api/v1/orgs/${orgId}/leagues`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: `League ${suffix}`, sport: 'pool', rulesetId: ruleset.body.id })
      .expect(201);

    const season = await api(app)
      .post(`/api/v1/orgs/${orgId}/leagues/${league.body.id}/seasons`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: `Season ${suffix}`,
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-12-31T00:00:00.000Z',
      })
      .expect(201);

    const division = await api(app)
      .post(`/api/v1/orgs/${orgId}/seasons/${season.body.id}/divisions`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: `Division ${suffix}` })
      .expect(201);

    const teamA = await api(app)
      .post(`/api/v1/orgs/${orgId}/divisions/${division.body.id}/teams`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: `Team A ${suffix}` })
      .expect(201);
    const teamB = await api(app)
      .post(`/api/v1/orgs/${orgId}/divisions/${division.body.id}/teams`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: `Team B ${suffix}` })
      .expect(201);

    let resolvedPlayerAId = playerAId;
    let resolvedPlayerBId = playerBId;
    if (!resolvedPlayerAId) {
      const playerA = await api(app)
        .post(`/api/v1/orgs/${orgId}/players`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ displayName: `Player A ${suffix}`, contactEmail: `h2h_a_${suffix}_${Date.now()}@example.com` })
        .expect(201);
      resolvedPlayerAId = playerA.body.id as string;
    }
    if (!resolvedPlayerBId) {
      const playerB = await api(app)
        .post(`/api/v1/orgs/${orgId}/players`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ displayName: `Player B ${suffix}`, contactEmail: `h2h_b_${suffix}_${Date.now()}@example.com` })
        .expect(201);
      resolvedPlayerBId = playerB.body.id as string;
    }

    await api(app)
      .post(`/api/v1/orgs/${orgId}/teams/${teamA.body.id}/players`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ playerId: resolvedPlayerAId, role: 'PLAYER' })
      .expect(201);
    await api(app)
      .post(`/api/v1/orgs/${orgId}/teams/${teamB.body.id}/players`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ playerId: resolvedPlayerBId, role: 'PLAYER' })
      .expect(201);

    await api(app)
      .post(`/api/v1/orgs/${orgId}/divisions/${division.body.id}/fixtures:generate`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(201);

    const fixtures = await api(app)
      .get(`/api/v1/orgs/${orgId}/divisions/${division.body.id}/fixtures`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    const fixture = fixtures.body[0] as any;

    return {
      seasonId: season.body.id as string,
      divisionId: division.body.id as string,
      teamAId: teamA.body.id as string,
      teamBId: teamB.body.id as string,
      playerAId: resolvedPlayerAId!,
      playerBId: resolvedPlayerBId!,
      fixtureId: fixture.id as string,
      fixtureHomeTeamId: fixture.homeTeamId as string,
    };
  }

  it('returns locked-only LEAGUE head-to-head summary and last matches', async () => {
    const ownerEmail = `h2h_owner_${Date.now()}@example.com`;
    const password = 'password1234';
    const ownerReg = await api(app).post('/api/v1/auth/register').send({ email: ownerEmail, password }).expect(201);
    const ownerToken = ownerReg.body.accessToken;

    const org = await api(app)
      .post('/api/v1/orgs')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'H2H Org' })
      .expect(201);
    const orgId = org.body.id as string;

    const setup = await setupLeagueSeason(ownerToken, orgId, 'happy');

    const homeFrames = setup.fixtureHomeTeamId === setup.teamAId ? 6 : 4;
    const awayFrames = setup.fixtureHomeTeamId === setup.teamAId ? 4 : 6;
    await api(app)
      .post(`/api/v1/orgs/${orgId}/fixtures/${setup.fixtureId}/complete`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        expectedRevision: 0,
        homeFrames,
        awayFrames,
        reason: 'Admin lock override for head-to-head test',
      })
      .expect(201);

    const response = await api(app)
      .get(`/api/v1/orgs/${orgId}/stats/head-to-head?playerA=${setup.playerAId}&playerB=${setup.playerBId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(response.body.scope).toBe('LEAGUE');
    expect(response.body.filters).toHaveProperty('seasonId');
    expect(response.body.players.a.playerId).toBe(setup.playerAId);
    expect(response.body.players.b.playerId).toBe(setup.playerBId);
    expect(response.body.summary.matchesPlayed).toBe(1);
    expect(response.body.summary.aWins).toBe(1);
    expect(response.body.summary.bWins).toBe(0);
    expect(response.body.summary.draws).toBe(0);
    expect(response.body.summary.aFramesWon).toBe(6);
    expect(response.body.summary.bFramesWon).toBe(4);
    expect(response.body.lastMatches).toHaveLength(1);
    expect(response.body.lastMatches[0].fixtureId).toBe(setup.fixtureId);
    expect(response.body.lastMatches[0].seasonId).toBe(setup.seasonId);
    expect(response.body.lastMatches[0].aFrames).toBe(6);
    expect(response.body.lastMatches[0].bFrames).toBe(4);
    expect(response.body.lastMatches[0].winnerPlayerId).toBe(setup.playerAId);
  });

  it('filters head-to-head by seasonId', async () => {
    const ownerEmail = `h2h_filter_owner_${Date.now()}@example.com`;
    const password = 'password1234';
    const ownerReg = await api(app).post('/api/v1/auth/register').send({ email: ownerEmail, password }).expect(201);
    const ownerToken = ownerReg.body.accessToken;

    const org = await api(app)
      .post('/api/v1/orgs')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'H2H Filter Org' })
      .expect(201);
    const orgId = org.body.id as string;

    const first = await setupLeagueSeason(ownerToken, orgId, 'season1');
    const second = await setupLeagueSeason(ownerToken, orgId, 'season2', first.playerAId, first.playerBId);

    const firstHomeFrames = first.fixtureHomeTeamId === first.teamAId ? 6 : 4;
    const firstAwayFrames = first.fixtureHomeTeamId === first.teamAId ? 4 : 6;
    await api(app)
      .post(`/api/v1/orgs/${orgId}/fixtures/${first.fixtureId}/complete`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        expectedRevision: 0,
        homeFrames: firstHomeFrames,
        awayFrames: firstAwayFrames,
        reason: 'Admin lock override season one',
      })
      .expect(201);

    const secondHomeFrames = second.fixtureHomeTeamId === second.teamAId ? 2 : 7;
    const secondAwayFrames = second.fixtureHomeTeamId === second.teamAId ? 7 : 2;
    await api(app)
      .post(`/api/v1/orgs/${orgId}/fixtures/${second.fixtureId}/complete`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        expectedRevision: 0,
        homeFrames: secondHomeFrames,
        awayFrames: secondAwayFrames,
        reason: 'Admin lock override season two',
      })
      .expect(201);

    const unfiltered = await api(app)
      .get(`/api/v1/orgs/${orgId}/stats/head-to-head?playerA=${first.playerAId}&playerB=${first.playerBId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(unfiltered.body.summary.matchesPlayed).toBe(2);

    const filtered = await api(app)
      .get(`/api/v1/orgs/${orgId}/stats/head-to-head?playerA=${first.playerAId}&playerB=${first.playerBId}&seasonId=${first.seasonId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(filtered.body.summary.matchesPlayed).toBe(1);
    expect(filtered.body.summary.aWins).toBe(1);
    expect(filtered.body.summary.aFramesWon).toBe(6);
    expect(filtered.body.summary.bFramesWon).toBe(4);
    expect(filtered.body.lastMatches[0].seasonId).toBe(first.seasonId);
  });

  it('rejects unsupported scope values', async () => {
    const ownerEmail = `h2h_scope_owner_${Date.now()}@example.com`;
    const password = 'password1234';
    const ownerReg = await api(app).post('/api/v1/auth/register').send({ email: ownerEmail, password }).expect(201);
    const ownerToken = ownerReg.body.accessToken;

    const org = await api(app)
      .post('/api/v1/orgs')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'H2H Scope Org' })
      .expect(201);
    const orgId = org.body.id as string;

    const setup = await setupLeagueSeason(ownerToken, orgId, 'scope');

    await api(app)
      .get(`/api/v1/orgs/${orgId}/stats/head-to-head?playerA=${setup.playerAId}&playerB=${setup.playerBId}&scope=TOURNAMENT`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(400);
  });

  it('excludes non-LOCKED fixtures from head-to-head', async () => {
    const ownerEmail = `h2h_locked_owner_${Date.now()}@example.com`;
    const password = 'password1234';
    const ownerReg = await api(app).post('/api/v1/auth/register').send({ email: ownerEmail, password }).expect(201);
    const ownerToken = ownerReg.body.accessToken;

    const org = await api(app)
      .post('/api/v1/orgs')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'H2H Locked Org' })
      .expect(201);
    const orgId = org.body.id as string;

    const setup = await setupLeagueSeason(ownerToken, orgId, 'locked');

    const lockedHomeFrames = setup.fixtureHomeTeamId === setup.teamAId ? 6 : 4;
    const lockedAwayFrames = setup.fixtureHomeTeamId === setup.teamAId ? 4 : 6;
    await api(app)
      .post(`/api/v1/orgs/${orgId}/fixtures/${setup.fixtureId}/complete`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        expectedRevision: 0,
        homeFrames: lockedHomeFrames,
        awayFrames: lockedAwayFrames,
        reason: 'Admin lock override locked fixture',
      })
      .expect(201);

    const nonLockedFixture = await prisma.fixture.create({
      data: {
        divisionId: setup.divisionId,
        homeTeamId: setup.teamAId,
        awayTeamId: setup.teamBId,
      },
    });

    await api(app)
      .post(`/api/v1/orgs/${orgId}/fixtures/${nonLockedFixture.id}/events`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        eventType: 'MATCH_COMPLETED',
        expectedRevision: 0,
        payload: { home_frames: 10, away_frames: 0 },
      })
      .expect(201);

    const response = await api(app)
      .get(`/api/v1/orgs/${orgId}/stats/head-to-head?playerA=${setup.playerAId}&playerB=${setup.playerBId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(response.body.summary.matchesPlayed).toBe(1);
    expect(response.body.summary.aFramesWon).toBe(6);
    expect(response.body.summary.bFramesWon).toBe(4);
  });
});
