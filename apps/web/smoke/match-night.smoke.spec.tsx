import { renderToStaticMarkup } from 'react-dom/server';
import {
  MatchNightView,
  type Fixture,
  type MatchToken,
  type Team,
} from '../app/match-night/match-night-view';

describe('match night smoke', () => {
  const homeTeam: Team = {
    id: 'team-home',
    name: 'Red Lion',
    roster: [{ id: 'roster-1', role: 'CAPTAIN', player: { id: 'player-1', displayName: 'Captain Home' } }],
  };
  const awayTeam: Team = {
    id: 'team-away',
    name: 'White Hart',
    roster: [{ id: 'roster-2', role: 'CAPTAIN', player: { id: 'player-2', displayName: 'Captain Away' } }],
  };
  const fixture: Fixture = {
    id: 'fixture-1',
    homeTeam,
    awayTeam,
    state: 'IN_PROGRESS',
  };
  const acceptedToken: MatchToken = {
    id: 'token-1',
    fixtureId: 'fixture-1',
    teamId: 'team-home',
    currentHolderPlayerId: 'player-1',
    issuedAt: '2026-03-03T00:00:00.000Z',
    acceptedAt: '2026-03-03T00:05:00.000Z',
    revokedAt: null,
  };

  function renderView(overrides?: Partial<React.ComponentProps<typeof MatchNightView>>) {
    return renderToStaticMarkup(
      <MatchNightView
        orgId="org-123"
        divisionId="division-123"
        fixtureId="fixture-1"
        fixtures={[fixture]}
        events={[]}
        tokensByFixture={{ 'fixture-1': [acceptedToken] }}
        teams={[homeTeam, awayTeam]}
        disputes={[]}
        me={{ id: 'user-1', email: 'captain@example.com' }}
        frameNo={1}
        winnerTeamId="team-home"
        homeFrames={7}
        awayFrames={4}
        tokenTeamId="team-home"
        holderPlayerId="player-1"
        transferToPlayerId="player-1"
        acceptPlayerId="player-1"
        actingPlayerId="player-1"
        showSubmitForm
        rejectReason=""
        status="Fixture loaded"
        error={null}
        onOrgIdChange={() => {}}
        onDivisionIdChange={() => {}}
        onFixtureIdChange={() => {}}
        onLoadSetup={() => {}}
        onRefreshFixture={() => {}}
        onTokenTeamIdChange={() => {}}
        onHolderPlayerIdChange={() => {}}
        onTransferToPlayerIdChange={() => {}}
        onAcceptPlayerIdChange={() => {}}
        onActingPlayerIdChange={() => {}}
        onShowSubmitFormChange={() => {}}
        onRejectReasonChange={() => {}}
        onFrameNoChange={() => {}}
        onWinnerTeamIdChange={() => {}}
        onHomeFramesChange={() => {}}
        onAwayFramesChange={() => {}}
        onIssueToken={() => {}}
        onTransferToken={() => {}}
        onAcceptToken={() => {}}
        onSubmitResult={() => {}}
        onApproveResult={() => {}}
        onRejectResult={() => {}}
        onRecordFrame={() => {}}
        onCompleteMatch={() => {}}
        {...overrides}
      />,
    );
  }

  it('renders canonical in-progress submit flow state', () => {
    const html = renderView();

    expect(html).toContain('Match Night');
    expect(html).toContain('Fixture state: <strong>IN_PROGRESS</strong>');
    expect(html).toContain('Required action: <strong>Submit result required</strong>');
    expect(html).toContain('Submit result');
    expect(html).toContain('Confirm submit');
    expect(html).toContain('Captain Home (team team-home)');
  });

  it('renders awaiting-opponent state after submit transition', () => {
    const html = renderView({
      fixtures: [{ ...fixture, state: 'AWAITING_OPPONENT' }],
      showSubmitForm: false,
      events: [
        {
          id: 'event-1',
          revision: 3,
          eventType: 'RESULT_SUBMITTED',
          createdAt: '2026-03-03T19:30:00.000Z',
          payload: { submitting_team_id: 'team-home', home_frames: 7, away_frames: 4 },
        },
      ],
    });

    expect(html).toContain('Fixture state: <strong>AWAITING_OPPONENT</strong>');
    expect(html).toContain('Required action: <strong>Awaiting opponent captain</strong>');
    expect(html).toContain('Latest submitted result: 7 - 4 (submitting team team-home)');
  });
});
