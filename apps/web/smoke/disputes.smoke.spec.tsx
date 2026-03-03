import { renderToStaticMarkup } from 'react-dom/server';
import { DisputesView, type DisputeFixture, type DisputeRecord } from '../app/disputes/disputes-view';

describe('disputes smoke', () => {
  const fixture: DisputeFixture = {
    id: 'fixture-1',
    homeTeam: { name: 'Red Lion' },
    awayTeam: { name: 'White Hart' },
  };

  function renderView(disputes: DisputeRecord[], overrides?: Partial<React.ComponentProps<typeof DisputesView>>) {
    return renderToStaticMarkup(
      <DisputesView
        orgId="org-123"
        divisionId="division-123"
        fixtureId="fixture-1"
        fixtures={[fixture]}
        disputes={disputes}
        reason="Score disagreement"
        resolutionStatus="resolved"
        outcome="Score confirmed after review"
        status="Disputes loaded"
        error={null}
        onOrgIdChange={() => {}}
        onDivisionIdChange={() => {}}
        onFixtureIdChange={() => {}}
        onReasonChange={() => {}}
        onResolutionStatusChange={() => {}}
        onOutcomeChange={() => {}}
        onLoadFixtures={() => {}}
        onRefreshDisputes={() => {}}
        onCreateDispute={() => {}}
        onResolveDispute={() => {}}
        {...overrides}
      />,
    );
  }

  it('renders open dispute metadata clearly', () => {
    const html = renderView([
      {
        id: 'dispute-1',
        status: 'open',
        reason: 'Opponent rejects submitted score',
        outcome: null,
        createdAt: '2026-03-03T20:00:00.000Z',
      },
    ]);

    expect(html).toContain('Disputes');
    expect(html).toContain('Create dispute');
    expect(html).toContain('Current disputes');
    expect(html).toContain('<strong>open</strong> | Opponent rejects submitted score | No outcome');
  });

  it('renders resolved dispute outcome state', () => {
    const html = renderView([
      {
        id: 'dispute-2',
        status: 'resolved',
        reason: 'Frame attribution reviewed',
        outcome: 'Score confirmed after committee review',
        createdAt: '2026-03-03T21:00:00.000Z',
      },
    ]);

    expect(html).toContain('<strong>resolved</strong> | Frame attribution reviewed | Score confirmed after committee review');
    expect(html).toContain('resolved');
    expect(html).toContain('Outcome / resolution note');
  });
});
