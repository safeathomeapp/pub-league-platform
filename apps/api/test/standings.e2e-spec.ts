import { INestApplication } from '@nestjs/common';
import { api, bootstrapTestApp } from './test-utils';

describe('standings (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await bootstrapTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('computes deterministic standings from MATCH_COMPLETED ledger events', async () => {
    const ownerEmail = `standings_owner_${Date.now()}@example.com`;
    const outsiderEmail = `standings_outsider_${Date.now()}@example.com`;
    const password = 'password1234';

    const ownerReg = await api(app).post('/api/v1/auth/register').send({ email: ownerEmail, password }).expect(201);
    const ownerToken = ownerReg.body.accessToken;
    const outsiderReg = await api(app).post('/api/v1/auth/register').send({ email: outsiderEmail, password }).expect(201);
    const outsiderToken = outsiderReg.body.accessToken;

    const org = await api(app).post('/api/v1/orgs').set('Authorization', `Bearer ${ownerToken}`).send({ name: 'Standings Org' }).expect(201);
    const orgId = org.body.id as string;

    await api(app).post('/api/v1/orgs').set('Authorization', `Bearer ${outsiderToken}`).send({ name: 'Other Org' }).expect(201);

    const ruleset = await api(app)
      .post(`/api/v1/orgs/${orgId}/rulesets`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Pool Ruleset',
        sport: 'pool',
        config: { points_model: { win: 2, draw: 1, loss: 0 } },
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

    await api(app).post(`/api/v1/orgs/${orgId}/divisions/${division.body.id}/teams`).set('Authorization', `Bearer ${ownerToken}`).send({ name: 'Team A' }).expect(201);
    await api(app).post(`/api/v1/orgs/${orgId}/divisions/${division.body.id}/teams`).set('Authorization', `Bearer ${ownerToken}`).send({ name: 'Team B' }).expect(201);
    await api(app).post(`/api/v1/orgs/${orgId}/divisions/${division.body.id}/teams`).set('Authorization', `Bearer ${ownerToken}`).send({ name: 'Team C' }).expect(201);

    await api(app)
      .post(`/api/v1/orgs/${orgId}/divisions/${division.body.id}/fixtures:generate`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(201);

    const fixtures = await api(app)
      .get(`/api/v1/orgs/${orgId}/divisions/${division.body.id}/fixtures`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    const findFixture = (teamOne: string, teamTwo: string) =>
      fixtures.body.find((fixture: any) => {
        const teams = [fixture.homeTeam.name, fixture.awayTeam.name].sort();
        return teams[0] === [teamOne, teamTwo].sort()[0] && teams[1] === [teamOne, teamTwo].sort()[1];
      }) as any;

    const fixtureAB = findFixture('Team A', 'Team B');
    const fixtureAC = findFixture('Team A', 'Team C');
    expect(fixtureAB).toBeTruthy();
    expect(fixtureAC).toBeTruthy();

    const scoreForTeamAWin = (fixture: any) =>
      fixture.homeTeam.name === 'Team A' ? { homeFrames: 7, awayFrames: 3 } : { homeFrames: 3, awayFrames: 7 };

    await api(app)
      .post(`/api/v1/orgs/${orgId}/fixtures/${fixtureAB.id}/complete`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ expectedRevision: 0, ...scoreForTeamAWin(fixtureAB) })
      .expect(201);

    await api(app)
      .post(`/api/v1/orgs/${orgId}/fixtures/${fixtureAC.id}/complete`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ expectedRevision: 0, ...scoreForTeamAWin(fixtureAC) })
      .expect(201);

    const standingsOne = await api(app)
      .get(`/api/v1/orgs/${orgId}/divisions/${division.body.id}/standings`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(Array.isArray(standingsOne.body.rows)).toBe(true);
    expect(standingsOne.body.rows).toHaveLength(3);
    expect(standingsOne.body.rows[0].teamName).toBe('Team A');
    expect(standingsOne.body.rows[0].matchPoints).toBe(4);
    expect(standingsOne.body.rows[0].matchesWon).toBe(2);

    const standingsTwo = await api(app)
      .get(`/api/v1/orgs/${orgId}/divisions/${division.body.id}/standings`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);

    expect(standingsTwo.body.rows).toEqual(standingsOne.body.rows);

    await api(app)
      .get(`/api/v1/orgs/${orgId}/divisions/${division.body.id}/standings`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .expect(403);
  });
});
