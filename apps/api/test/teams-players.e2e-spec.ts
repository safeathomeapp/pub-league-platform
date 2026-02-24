import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { api, bootstrapTestApp } from './test-utils';

describe('teams/players/rosters (e2e)', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    app = await bootstrapTestApp();
  });

  afterAll(async () => {
    await prisma.$disconnect();
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

  it('enforces season roster lock policy and supports admin transfer override with audit', async () => {
    const ownerEmail = `policy_owner_${Date.now()}@example.com`;
    const captainEmail = `policy_captain_${Date.now()}@example.com`;
    const password = 'password1234';

    const ownerReg = await api(app).post('/api/v1/auth/register').send({ email: ownerEmail, password }).expect(201);
    const ownerToken = ownerReg.body.accessToken;
    const captainReg = await api(app).post('/api/v1/auth/register').send({ email: captainEmail, password }).expect(201);
    const captainToken = captainReg.body.accessToken;

    const org = await api(app)
      .post('/api/v1/orgs')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Policy Org' })
      .expect(201);
    const orgId = org.body.id as string;

    await api(app)
      .post(`/api/v1/orgs/${orgId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: captainEmail, role: 'CAPTAIN' })
      .expect(201);

    const ruleset = await api(app)
      .post(`/api/v1/orgs/${orgId}/rulesets`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Policy Ruleset',
        sport: 'pool',
        config: { points_model: { win: 2, draw: 1, loss: 0 } },
      })
      .expect(201);

    const league = await api(app)
      .post(`/api/v1/orgs/${orgId}/leagues`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Policy League', sport: 'pool', rulesetId: ruleset.body.id })
      .expect(201);

    const season = await api(app)
      .post(`/api/v1/orgs/${orgId}/leagues/${league.body.id}/seasons`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Policy Season',
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

    const lockedPlayer = await api(app)
      .post(`/api/v1/orgs/${orgId}/players`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ displayName: 'Locked Player', contactEmail: `locked_${Date.now()}@example.com` })
      .expect(201);

    const zeroAppearancesPlayer = await api(app)
      .post(`/api/v1/orgs/${orgId}/players`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ displayName: 'Zero Player', contactEmail: `zero_${Date.now()}@example.com` })
      .expect(201);

    await api(app)
      .post(`/api/v1/orgs/${orgId}/teams/${teamA.body.id}/players`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ playerId: lockedPlayer.body.id, role: 'PLAYER' })
      .expect(201);
    await api(app)
      .post(`/api/v1/orgs/${orgId}/teams/${teamA.body.id}/players`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ playerId: zeroAppearancesPlayer.body.id, role: 'PLAYER' })
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
      .post(`/api/v1/orgs/${orgId}/fixtures/${fixtureId}/complete`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        expectedRevision: 0,
        homeFrames: 7,
        awayFrames: 4,
        reason: 'Admin lock override for roster policy test',
      })
      .expect(201);

    const standingsBefore = await api(app)
      .get(`/api/v1/orgs/${orgId}/divisions/${division.body.id}/standings`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    await api(app)
      .post(`/api/v1/orgs/${orgId}/seasons/${season.body.id}/players/${lockedPlayer.body.id}/transfer`)
      .set('Authorization', `Bearer ${captainToken}`)
      .send({ toTeamId: teamB.body.id, effectiveFrom: new Date().toISOString(), reason: 'Captain requested move' })
      .expect(403);

    await api(app)
      .post(`/api/v1/orgs/${orgId}/seasons/${season.body.id}/players/${lockedPlayer.body.id}/transfer`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ toTeamId: teamB.body.id, effectiveFrom: new Date().toISOString(), reason: '' })
      .expect(400);

    const transferredLocked = await api(app)
      .post(`/api/v1/orgs/${orgId}/seasons/${season.body.id}/players/${lockedPlayer.body.id}/transfer`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ toTeamId: teamB.body.id, effectiveFrom: new Date().toISOString(), reason: 'Hardship override approved' })
      .expect(201);
    expect(transferredLocked.body.teamId).toBe(teamB.body.id);

    const auditLocked = await prisma.rosterTransferAudit.findFirst({
      where: {
        organisationId: orgId,
        seasonId: season.body.id,
        playerId: lockedPlayer.body.id,
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(auditLocked).toBeTruthy();
    expect(auditLocked?.reason).toBe('Hardship override approved');
    expect(auditLocked?.wasAdminOverride).toBe(true);

    await api(app)
      .post(`/api/v1/orgs/${orgId}/seasons/${season.body.id}/players/${zeroAppearancesPlayer.body.id}/transfer`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ toTeamId: teamB.body.id, effectiveFrom: new Date().toISOString(), reason: '' })
      .expect(400);

    const transferredZero = await api(app)
      .post(`/api/v1/orgs/${orgId}/seasons/${season.body.id}/players/${zeroAppearancesPlayer.body.id}/transfer`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ toTeamId: teamB.body.id, effectiveFrom: new Date().toISOString(), reason: 'Admin approved early-season move' })
      .expect(201);
    expect(transferredZero.body.teamId).toBe(teamB.body.id);

    const standingsAfter = await api(app)
      .get(`/api/v1/orgs/${orgId}/divisions/${division.body.id}/standings`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(standingsAfter.body.rows).toEqual(standingsBefore.body.rows);
  });

  it('supports future-dated transfer scheduling and transfer history listing', async () => {
    const ownerEmail = `transfer_owner_${Date.now()}@example.com`;
    const outsiderEmail = `transfer_outsider_${Date.now()}@example.com`;
    const password = 'password1234';

    const ownerReg = await api(app).post('/api/v1/auth/register').send({ email: ownerEmail, password }).expect(201);
    const ownerToken = ownerReg.body.accessToken;
    const outsiderReg = await api(app).post('/api/v1/auth/register').send({ email: outsiderEmail, password }).expect(201);
    const outsiderToken = outsiderReg.body.accessToken;

    const org = await api(app)
      .post('/api/v1/orgs')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Transfer Org' })
      .expect(201);
    const orgId = org.body.id as string;

    const outsiderOrg = await api(app)
      .post('/api/v1/orgs')
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({ name: 'Outsider Org' })
      .expect(201);

    const ruleset = await api(app)
      .post(`/api/v1/orgs/${orgId}/rulesets`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Transfer Ruleset',
        sport: 'pool',
        config: { points_model: { win: 2, draw: 1, loss: 0 } },
      })
      .expect(201);

    const league = await api(app)
      .post(`/api/v1/orgs/${orgId}/leagues`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Transfer League', sport: 'pool', rulesetId: ruleset.body.id })
      .expect(201);

    const season = await api(app)
      .post(`/api/v1/orgs/${orgId}/leagues/${league.body.id}/seasons`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Transfer Season',
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

    const player = await api(app)
      .post(`/api/v1/orgs/${orgId}/players`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ displayName: 'Future Move Player', contactEmail: `future_${Date.now()}@example.com` })
      .expect(201);

    await api(app)
      .post(`/api/v1/orgs/${orgId}/teams/${teamA.body.id}/players`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ playerId: player.body.id, role: 'PLAYER' })
      .expect(201);

    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const scheduleTransfer = await api(app)
      .post(`/api/v1/orgs/${orgId}/seasons/${season.body.id}/players/${player.body.id}/transfer`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ toTeamId: teamB.body.id, effectiveFrom: futureDate, reason: 'Scheduled for next match day' })
      .expect(201);

    expect(scheduleTransfer.body.pending).toBe(true);
    expect(scheduleTransfer.body.fromTeamId).toBe(teamA.body.id);
    expect(scheduleTransfer.body.toTeamId).toBe(teamB.body.id);

    const teamsBefore = await api(app)
      .get(`/api/v1/orgs/${orgId}/divisions/${division.body.id}/teams`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    const teamABefore = teamsBefore.body.find((t: { id: string }) => t.id === teamA.body.id);
    const teamBBefore = teamsBefore.body.find((t: { id: string }) => t.id === teamB.body.id);
    expect(teamABefore.roster.some((entry: { playerId: string }) => entry.playerId === player.body.id)).toBe(true);
    expect(teamBBefore.roster.some((entry: { playerId: string }) => entry.playerId === player.body.id)).toBe(false);

    const history = await api(app)
      .get(`/api/v1/orgs/${orgId}/seasons/${season.body.id}/transfers?playerId=${player.body.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(Array.isArray(history.body)).toBe(true);
    expect(history.body.length).toBeGreaterThanOrEqual(1);
    expect(history.body[0].playerId).toBe(player.body.id);
    expect(history.body[0].effectiveFrom).toBeTruthy();
    expect(history.body[0].appliedAt).toBeNull();

    await api(app)
      .get(`/api/v1/orgs/${orgId}/seasons/${season.body.id}/transfers`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(403);

    await api(app)
      .get(`/api/v1/orgs/${outsiderOrg.body.id}/seasons/${season.body.id}/transfers`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(403);
  });
});
