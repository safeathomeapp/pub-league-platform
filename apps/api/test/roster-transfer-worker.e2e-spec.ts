import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { RosterTransferWorker } from '../src/modules/teams-players/roster-transfer.worker';
import { api, bootstrapTestApp } from './test-utils';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('roster transfer worker (e2e)', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    app = await bootstrapTestApp();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('applies due future-dated transfers via worker process without roster read trigger', async () => {
    const ownerEmail = `worker_owner_${Date.now()}@example.com`;
    const password = 'password1234';

    const ownerReg = await api(app).post('/api/v1/auth/register').send({ email: ownerEmail, password }).expect(201);
    const ownerToken = ownerReg.body.accessToken as string;

    const org = await api(app)
      .post('/api/v1/orgs')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Worker Org' })
      .expect(201);
    const orgId = org.body.id as string;

    const ruleset = await api(app)
      .post(`/api/v1/orgs/${orgId}/rulesets`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Worker Ruleset',
        sport: 'pool',
        config: { points_model: { win: 2, draw: 1, loss: 0 } },
      })
      .expect(201);

    const league = await api(app)
      .post(`/api/v1/orgs/${orgId}/leagues`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Worker League', sport: 'pool', rulesetId: ruleset.body.id })
      .expect(201);

    const season = await api(app)
      .post(`/api/v1/orgs/${orgId}/leagues/${league.body.id}/seasons`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Worker Season',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-12-31T00:00:00.000Z',
      })
      .expect(201);

    const division = await api(app)
      .post(`/api/v1/orgs/${orgId}/seasons/${season.body.id}/divisions`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Worker Division' })
      .expect(201);

    const teamA = await api(app)
      .post(`/api/v1/orgs/${orgId}/divisions/${division.body.id}/teams`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Worker Team A' })
      .expect(201);
    const teamB = await api(app)
      .post(`/api/v1/orgs/${orgId}/divisions/${division.body.id}/teams`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Worker Team B' })
      .expect(201);

    const player = await api(app)
      .post(`/api/v1/orgs/${orgId}/players`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ displayName: 'Worker Player', contactEmail: `worker_player_${Date.now()}@example.com` })
      .expect(201);

    await api(app)
      .post(`/api/v1/orgs/${orgId}/teams/${teamA.body.id}/players`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ playerId: player.body.id, role: 'PLAYER' })
      .expect(201);

    const effectiveFrom = new Date(Date.now() + 750).toISOString();
    await api(app)
      .post(`/api/v1/orgs/${orgId}/seasons/${season.body.id}/players/${player.body.id}/transfer`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ toTeamId: teamB.body.id, effectiveFrom, reason: 'Worker scheduled transfer' })
      .expect(201);

    const before = await prisma.teamPlayer.findFirst({
      where: { seasonId: season.body.id, playerId: player.body.id },
      select: { teamId: true },
    });
    expect(before?.teamId).toBe(teamA.body.id);

    await sleep(900);
    const worker = app.get(RosterTransferWorker);
    await worker.processDue();

    const after = await prisma.teamPlayer.findFirst({
      where: { seasonId: season.body.id, playerId: player.body.id },
      select: { teamId: true },
    });
    expect(after?.teamId).toBe(teamB.body.id);
  });
});
