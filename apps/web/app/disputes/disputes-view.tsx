import type { CSSProperties, FormEvent } from 'react';

export type DisputeFixture = {
  id: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
};

export type DisputeRecord = {
  id: string;
  status: string;
  reason: string | null;
  outcome: string | null;
  createdAt: string;
};

type Props = {
  orgId: string;
  divisionId: string;
  fixtureId: string;
  fixtures: DisputeFixture[];
  disputes: DisputeRecord[];
  reason: string;
  resolutionStatus: string;
  outcome: string;
  status: string | null;
  error: string | null;
  onOrgIdChange: (value: string) => void;
  onDivisionIdChange: (value: string) => void;
  onFixtureIdChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onResolutionStatusChange: (value: string) => void;
  onOutcomeChange: (value: string) => void;
  onLoadFixtures: (event: FormEvent) => void;
  onRefreshDisputes: () => void;
  onCreateDispute: () => void;
  onResolveDispute: (disputeId: string) => void;
};

export function DisputesView(props: Props) {
  const {
    orgId,
    divisionId,
    fixtureId,
    fixtures,
    disputes,
    reason,
    resolutionStatus,
    outcome,
    status,
    error,
  } = props;

  return (
    <main>
      <h1>Disputes</h1>
      <p>Create disputes, review status, and resolve with an outcome note.</p>
      <p>
        <a href="/orgs">Organisations</a> | <a href="/schedule">Schedule</a> | <a href="/match-night">Match Night</a>
      </p>

      <form onSubmit={props.onLoadFixtures} style={formRowStyle}>
        <input placeholder="orgId" value={orgId} onChange={e => props.onOrgIdChange(e.target.value)} required />
        <input placeholder="divisionId" value={divisionId} onChange={e => props.onDivisionIdChange(e.target.value)} required />
        <button type="submit">Load fixtures</button>
      </form>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <select value={fixtureId} onChange={e => props.onFixtureIdChange(e.target.value)}>
          <option value="">Select fixture</option>
          {fixtures.map(item => (
            <option key={item.id} value={item.id}>
              {item.homeTeam.name} vs {item.awayTeam.name}
            </option>
          ))}
        </select>
        <button type="button" onClick={props.onRefreshDisputes} disabled={!fixtureId}>
          Refresh disputes
        </button>
      </div>

      {status ? <p>{status}</p> : null}
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}

      <h2>Create dispute</h2>
      <div style={formRowStyle}>
        <input
          placeholder="Reason"
          value={reason}
          onChange={e => props.onReasonChange(e.target.value)}
          style={{ minWidth: 360 }}
        />
        <button type="button" onClick={props.onCreateDispute} disabled={!fixtureId || reason.length < 3}>
          Create
        </button>
      </div>

      <h2>Current disputes</h2>
      <div style={formRowStyle}>
        <select value={resolutionStatus} onChange={e => props.onResolutionStatusChange(e.target.value)}>
          <option value="under_review">under_review</option>
          <option value="resolved">resolved</option>
          <option value="rejected">rejected</option>
          <option value="open">open</option>
        </select>
        <input
          placeholder="Outcome / resolution note"
          value={outcome}
          onChange={e => props.onOutcomeChange(e.target.value)}
          style={{ minWidth: 360 }}
        />
      </div>

      <ul>
        {disputes.map(dispute => (
          <li key={dispute.id} style={{ marginBottom: 8 }}>
            <strong>{dispute.status}</strong> | {dispute.reason ?? 'No reason'} | {dispute.outcome ?? 'No outcome'}{' '}
            <button type="button" onClick={() => props.onResolveDispute(dispute.id)}>
              Update
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}

const formRowStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  marginBottom: 12,
};
