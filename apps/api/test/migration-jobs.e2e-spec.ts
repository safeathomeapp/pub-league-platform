import { INestApplication } from '@nestjs/common';
import { MigrationJobStatus, PrismaClient } from '@prisma/client';
import { api, bootstrapTestApp } from './test-utils';

describe('migration jobs (e2e)', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    app = await bootstrapTestApp();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('supports create, review, import, org isolation, and repeated-import protection', async () => {
    const adminEmail = `migration_admin_${Date.now()}@example.com`;
    const otherEmail = `migration_other_${Date.now()}@example.com`;
    const password = 'password1234';

    const adminReg = await api(app).post('/api/v1/auth/register').send({ email: adminEmail, password }).expect(201);
    const adminToken = adminReg.body.accessToken as string;
    const otherReg = await api(app).post('/api/v1/auth/register').send({ email: otherEmail, password }).expect(201);
    const otherToken = otherReg.body.accessToken as string;

    const orgA = await api(app)
      .post('/api/v1/orgs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Migration Org A' })
      .expect(201);
    const orgAId = orgA.body.id as string;
    const orgB = await api(app)
      .post('/api/v1/orgs')
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Migration Org B' })
      .expect(201);
    const orgBId = orgB.body.id as string;

    const ruleset = await prisma.ruleset.create({
      data: {
        organisationId: orgAId,
        name: 'Migration Ruleset',
        sport: 'pool',
        config: { points_model: { win: 2, draw: 0, loss: 0 } },
      },
    });

    const created = await api(app)
      .post(`/api/v1/orgs/${orgAId}/migration-jobs`)
      .set('Authorization', `Bearer ${adminToken}`)
      .field('sourceType', 'SCREENSHOT')
      .attach('file', Buffer.from('legacy scoreboard screenshot'), 'scoreboard.png')
      .expect(201);

    expect(created.body.organisationId).toBe(orgAId);
    expect(created.body.status).toBe(MigrationJobStatus.REVIEW_REQUIRED);
    expect(created.body.assets).toHaveLength(1);
    expect(created.body.assets[0].originalFilename).toBe('scoreboard.png');

    const jobId = created.body.id as string;

    const listed = await api(app)
      .get(`/api/v1/orgs/${orgAId}/migration-jobs?status=REVIEW_REQUIRED`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(listed.body).toHaveLength(1);

    await api(app)
      .get(`/api/v1/orgs/${orgAId}/migration-jobs/${jobId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);

    await api(app)
      .post(`/api/v1/orgs/${orgAId}/migration-jobs/${jobId}/import`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ confirm: true })
      .expect(409);

    const reviewed = await api(app)
      .patch(`/api/v1/orgs/${orgAId}/migration-jobs/${jobId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        readyToImport: true,
        draft: {
          league: { name: 'Imported League', sport: 'pool', rulesetId: ruleset.id },
          season: {
            name: 'Imported Season',
            startDate: '2026-01-01T00:00:00.000Z',
            endDate: '2026-12-31T00:00:00.000Z',
          },
          divisions: [{ tempId: 'div-1', name: 'Premier' }],
          teams: [
            { tempId: 'team-1', divisionTempId: 'div-1', name: 'Breakers' },
            { tempId: 'team-2', divisionTempId: 'div-1', name: 'Cue Masters' },
          ],
          players: [{ displayName: 'Alice Example' }, { displayName: 'Bob Example' }],
          fixtures: [
            {
              divisionTempId: 'div-1',
              homeTeamTempId: 'team-1',
              awayTeamTempId: 'team-2',
              scheduledAt: '2026-02-10T19:30:00.000Z',
            },
          ],
        },
      })
      .expect(200);

    expect(reviewed.body.status).toBe(MigrationJobStatus.READY_TO_IMPORT);

    const imported = await api(app)
      .post(`/api/v1/orgs/${orgAId}/migration-jobs/${jobId}/import`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ confirm: true })
      .expect(201);

    expect(imported.body.imported).toBe(true);
    expect(imported.body.summary.counts.divisions).toBe(1);
    expect(imported.body.summary.counts.teams).toBe(2);
    expect(imported.body.summary.counts.players).toBe(2);
    expect(imported.body.summary.counts.fixtures).toBe(1);
    expect(imported.body.job.status).toBe(MigrationJobStatus.IMPORTED);
    expect(imported.body.job.importAudits).toHaveLength(1);

    await api(app)
      .post(`/api/v1/orgs/${orgAId}/migration-jobs/${jobId}/import`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ confirm: true })
      .expect(409);

    const importedLeague = await prisma.league.findFirst({
      where: { organisationId: orgAId, name: 'Imported League' },
    });
    expect(importedLeague).not.toBeNull();

    const importAudit = await prisma.migrationImportAudit.findFirst({
      where: { organisationId: orgAId, migrationJobId: jobId },
    });
    expect(importAudit).not.toBeNull();

    const otherOrgJobs = await api(app)
      .get(`/api/v1/orgs/${orgBId}/migration-jobs`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(200);
    expect(otherOrgJobs.body).toHaveLength(0);
  });
});
