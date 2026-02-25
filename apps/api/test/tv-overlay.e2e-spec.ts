import { INestApplication } from '@nestjs/common';
import { FixtureState, FixtureStatus, MatchEventType, PrismaClient, SponsorScopeType } from '@prisma/client';
import { api, bootstrapTestApp } from './test-utils';

describe('tv overlay (e2e)', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    app = await bootstrapTestApp();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('returns org-scoped overlay payload with fixture partitioning and sponsor filtering', async () => {
    const ownerEmail = `tv_owner_${Date.now()}@example.com`;
    const outsiderEmail = `tv_outsider_${Date.now()}@example.com`;
    const password = 'password1234';

    const ownerReg = await api(app).post('/api/v1/auth/register').send({ email: ownerEmail, password }).expect(201);
    const ownerToken = ownerReg.body.accessToken as string;
    const outsiderReg = await api(app).post('/api/v1/auth/register').send({ email: outsiderEmail, password }).expect(201);
    const outsiderToken = outsiderReg.body.accessToken as string;

    const org = await api(app)
      .post('/api/v1/orgs')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'TV Org' })
      .expect(201);
    const orgId = org.body.id as string;

    await api(app)
      .post('/api/v1/orgs')
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({ name: 'TV Outsider Org' })
      .expect(201);

    const ruleset = await prisma.ruleset.create({
      data: {
        organisationId: orgId,
        name: 'TV Ruleset',
        sport: 'pool',
        config: { points_model: { win: 2, draw: 0, loss: 0 } },
      },
    });

    const league = await prisma.league.create({
      data: {
        organisationId: orgId,
        name: 'TV League',
        sport: 'pool',
        rulesetId: ruleset.id,
      },
    });

    const season = await prisma.season.create({
      data: {
        leagueId: league.id,
        name: 'TV Season',
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        endDate: new Date('2026-12-31T00:00:00.000Z'),
      },
    });

    const division = await prisma.division.create({
      data: {
        seasonId: season.id,
        name: 'TV Division',
      },
    });
    const otherDivision = await prisma.division.create({
      data: {
        seasonId: season.id,
        name: 'Other Division',
      },
    });

    const homeTeam = await prisma.team.create({ data: { divisionId: division.id, name: 'TV Home' } });
    const awayTeam = await prisma.team.create({ data: { divisionId: division.id, name: 'TV Away' } });

    const liveFixture = await prisma.fixture.create({
      data: {
        divisionId: division.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        scheduledAt: new Date('2026-08-01T19:00:00.000Z'),
        status: FixtureStatus.in_progress,
        state: FixtureState.IN_PROGRESS,
      },
    });

    await prisma.fixture.create({
      data: {
        divisionId: division.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        scheduledAt: new Date('2026-08-10T19:00:00.000Z'),
        status: FixtureStatus.scheduled,
        state: FixtureState.SCHEDULED,
      },
    });

    const lockedFixture = await prisma.fixture.create({
      data: {
        divisionId: division.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        scheduledAt: new Date('2026-07-15T19:00:00.000Z'),
        status: FixtureStatus.completed,
        state: FixtureState.LOCKED,
      },
    });

    await prisma.matchEvent.create({
      data: {
        fixtureId: lockedFixture.id,
        revision: 1,
        eventType: MatchEventType.MATCH_COMPLETED,
        actorUserId: ownerReg.body.user.id,
        payload: { home_frames: 6, away_frames: 4 },
      },
    });

    await prisma.sponsorSlot.createMany({
      data: [
        {
          organisationId: orgId,
          scopeType: SponsorScopeType.ORG,
          title: 'Org Sponsor',
          imageUrl: 'https://example.com/org.png',
          sortOrder: 1,
        },
        {
          organisationId: orgId,
          scopeType: SponsorScopeType.LEAGUE,
          scopeId: league.id,
          title: 'League Sponsor',
          imageUrl: 'https://example.com/league.png',
          sortOrder: 2,
        },
        {
          organisationId: orgId,
          scopeType: SponsorScopeType.DIVISION,
          scopeId: division.id,
          title: 'Division Sponsor',
          imageUrl: 'https://example.com/division.png',
          sortOrder: 3,
        },
        {
          organisationId: orgId,
          scopeType: SponsorScopeType.DIVISION,
          scopeId: otherDivision.id,
          title: 'Other Division Sponsor',
          imageUrl: 'https://example.com/other-division.png',
          sortOrder: 4,
        },
      ],
    });

    const overlay = await api(app)
      .get(`/api/v1/orgs/${orgId}/tv/overlay?divisionId=${division.id}&at=2026-08-01T20:00:00.000Z`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(overlay.body.division.id).toBe(division.id);
    expect(overlay.body.fixtures.live).toHaveLength(1);
    expect(overlay.body.fixtures.live[0].fixtureId).toBe(liveFixture.id);
    expect(Array.isArray(overlay.body.fixtures.next)).toBe(true);
    expect(overlay.body.fixtures.next.length).toBeGreaterThanOrEqual(1);
    expect(overlay.body.standings.rows.length).toBeGreaterThanOrEqual(2);

    const sponsorTitles = overlay.body.sponsors.map((s: { title: string | null }) => s.title);
    expect(sponsorTitles).toContain('Org Sponsor');
    expect(sponsorTitles).toContain('League Sponsor');
    expect(sponsorTitles).toContain('Division Sponsor');
    expect(sponsorTitles).not.toContain('Other Division Sponsor');

    await api(app)
      .get(`/api/v1/orgs/${orgId}/tv/overlay?divisionId=${division.id}`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(403);
  });

  it('supports team filtering and validates team/division membership', async () => {
    const ownerEmail = `tv_filter_owner_${Date.now()}@example.com`;
    const password = 'password1234';

    const ownerReg = await api(app).post('/api/v1/auth/register').send({ email: ownerEmail, password }).expect(201);
    const ownerToken = ownerReg.body.accessToken as string;

    const org = await api(app)
      .post('/api/v1/orgs')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'TV Filter Org' })
      .expect(201);
    const orgId = org.body.id as string;

    const ruleset = await prisma.ruleset.create({
      data: {
        organisationId: orgId,
        name: 'TV Filter Ruleset',
        sport: 'pool',
        config: { points_model: { win: 2, draw: 0, loss: 0 } },
      },
    });
    const league = await prisma.league.create({
      data: {
        organisationId: orgId,
        name: 'TV Filter League',
        sport: 'pool',
        rulesetId: ruleset.id,
      },
    });
    const season = await prisma.season.create({
      data: {
        leagueId: league.id,
        name: 'TV Filter Season',
        startDate: new Date('2026-01-01T00:00:00.000Z'),
        endDate: new Date('2026-12-31T00:00:00.000Z'),
      },
    });
    const division = await prisma.division.create({ data: { seasonId: season.id, name: 'Filter Division' } });
    const otherDivision = await prisma.division.create({ data: { seasonId: season.id, name: 'Other Division Filter' } });

    const teamA = await prisma.team.create({ data: { divisionId: division.id, name: 'Team A Filter' } });
    const teamB = await prisma.team.create({ data: { divisionId: division.id, name: 'Team B Filter' } });
    const otherTeam = await prisma.team.create({ data: { divisionId: otherDivision.id, name: 'Other Team Filter' } });

    await prisma.fixture.create({
      data: {
        divisionId: division.id,
        homeTeamId: teamA.id,
        awayTeamId: teamB.id,
        scheduledAt: new Date('2026-09-01T19:00:00.000Z'),
        state: FixtureState.SCHEDULED,
        status: FixtureStatus.scheduled,
      },
    });

    const filtered = await api(app)
      .get(`/api/v1/orgs/${orgId}/tv/overlay?divisionId=${division.id}&teamId=${teamA.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(filtered.body.fixtures.next.length).toBeGreaterThanOrEqual(1);
    for (const item of filtered.body.fixtures.next as Array<{ homeTeam: { id: string }; awayTeam: { id: string } }>) {
      expect(item.homeTeam.id === teamA.id || item.awayTeam.id === teamA.id).toBe(true);
    }

    await api(app)
      .get(`/api/v1/orgs/${orgId}/tv/overlay?divisionId=${division.id}&teamId=${otherTeam.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(404);
  });
});
