import type { CSSProperties, FormEvent } from 'react';

export type TeamPlayer = {
  id: string;
  role: string;
  player: { id: string; displayName: string };
};

export type Team = {
  id: string;
  name: string;
  roster?: TeamPlayer[];
};

export type Fixture = {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  state: 'SCHEDULED' | 'IN_PROGRESS' | 'SUBMITTED' | 'AWAITING_OPPONENT' | 'DISPUTED' | 'LOCKED';
};

export type MatchEvent = {
  id: string;
  revision: number;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type MatchToken = {
  id: string;
  fixtureId: string;
  teamId: string;
  currentHolderPlayerId: string;
  issuedAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
};

export type Dispute = {
  id: string;
  status: string;
  reason: string | null;
  outcome: string | null;
  createdAt: string;
};

export type SubmittedResult = {
  submittingTeamId: string;
  homeFrames: number;
  awayFrames: number;
} | null;

type Props = {
  orgId: string;
  divisionId: string;
  fixtureId: string;
  fixtures: Fixture[];
  events: MatchEvent[];
  tokensByFixture: Record<string, MatchToken[]>;
  teams: Team[];
  disputes: Dispute[];
  me: { id: string; email: string } | null;
  frameNo: number;
  winnerTeamId: string;
  homeFrames: number;
  awayFrames: number;
  tokenTeamId: string;
  holderPlayerId: string;
  transferToPlayerId: string;
  acceptPlayerId: string;
  actingPlayerId: string;
  showSubmitForm: boolean;
  rejectReason: string;
  status: string | null;
  error: string | null;
  onOrgIdChange: (value: string) => void;
  onDivisionIdChange: (value: string) => void;
  onFixtureIdChange: (value: string) => void;
  onLoadSetup: (event: FormEvent) => void;
  onRefreshFixture: () => void;
  onTokenTeamIdChange: (value: string) => void;
  onHolderPlayerIdChange: (value: string) => void;
  onTransferToPlayerIdChange: (value: string) => void;
  onAcceptPlayerIdChange: (value: string) => void;
  onActingPlayerIdChange: (value: string) => void;
  onShowSubmitFormChange: (updater: (current: boolean) => boolean) => void;
  onRejectReasonChange: (value: string) => void;
  onFrameNoChange: (value: number) => void;
  onWinnerTeamIdChange: (value: string) => void;
  onHomeFramesChange: (value: number) => void;
  onAwayFramesChange: (value: number) => void;
  onIssueToken: () => void;
  onTransferToken: () => void;
  onAcceptToken: () => void;
  onSubmitResult: () => void;
  onApproveResult: () => void;
  onRejectResult: () => void;
  onRecordFrame: () => void;
  onCompleteMatch: () => void;
};

export function MatchNightView(props: Props) {
  const {
    orgId,
    divisionId,
    fixtureId,
    fixtures,
    events,
    tokensByFixture,
    teams,
    disputes,
    me,
    frameNo,
    winnerTeamId,
    homeFrames,
    awayFrames,
    tokenTeamId,
    holderPlayerId,
    transferToPlayerId,
    acceptPlayerId,
    actingPlayerId,
    showSubmitForm,
    rejectReason,
    status,
    error,
  } = props;

  const selectedFixture = fixtures.find(item => item.id === fixtureId);
  const selectedTokens = tokensByFixture[fixtureId] ?? [];
  const currentRevision = events.length ? Math.max(...events.map(item => item.revision)) : 0;
  const acceptedTokens = selectedTokens.filter(token => !token.revokedAt && token.acceptedAt);
  const submittedResult = getLatestSubmittedResult(events);
  const actingToken = acceptedTokens.find(token => token.currentHolderPlayerId === actingPlayerId);
  const canSubmit =
    !!selectedFixture &&
    !!actingToken &&
    (selectedFixture.state === 'SCHEDULED' || selectedFixture.state === 'IN_PROGRESS');
  const canApproveOrReject =
    !!selectedFixture &&
    !!actingToken &&
    selectedFixture.state === 'AWAITING_OPPONENT' &&
    !!submittedResult &&
    actingToken.teamId !== submittedResult.submittingTeamId;
  const requiredAction = getRequiredActionLabel(selectedFixture?.state, canSubmit, canApproveOrReject);

  function teamOptionsForTokenAction() {
    if (!selectedFixture) return [];
    return [selectedFixture.homeTeam, selectedFixture.awayTeam];
  }

  function playerOptionsForTeam(teamId: string) {
    return (teams.find(team => team.id === teamId)?.roster ?? []).map(entry => entry.player);
  }

  return (
    <main>
      <h1>Match Night</h1>
      <p>Issue/transfer/accept tokens, submit results, and opponent sign-off.</p>
      <p>
        <a href="/orgs">Organisations</a> | <a href="/schedule">Schedule</a> | <a href="/disputes">Disputes</a> |{' '}
        <a href="/notifications-admin">Notifications Admin</a>
      </p>

      <form onSubmit={props.onLoadSetup} style={formRowStyle}>
        <input placeholder="orgId" value={orgId} onChange={e => props.onOrgIdChange(e.target.value)} required />
        <input placeholder="divisionId" value={divisionId} onChange={e => props.onDivisionIdChange(e.target.value)} required />
        <button type="submit">Load setup</button>
      </form>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <label htmlFor="fixtureId">Fixture</label>
        <select id="fixtureId" value={fixtureId} onChange={e => props.onFixtureIdChange(e.target.value)}>
          <option value="">Select fixture</option>
          {fixtures.map(item => (
            <option key={item.id} value={item.id}>
              {item.homeTeam.name} vs {item.awayTeam.name} ({item.state})
            </option>
          ))}
        </select>
        <button type="button" onClick={props.onRefreshFixture} disabled={!fixtureId}>
          Refresh fixture details
        </button>
      </div>

      {status ? <p>{status}</p> : null}
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
      {selectedFixture ? (
        <p>
          Fixture state: <strong>{selectedFixture.state}</strong> | Required action: <strong>{requiredAction}</strong>
        </p>
      ) : null}
      {me ? <p>Signed in as: {me.email}</p> : null}

      <h2>Token Control</h2>
      <div style={formRowStyle}>
        <select value={tokenTeamId} onChange={e => props.onTokenTeamIdChange(e.target.value)}>
          <option value="">Select team</option>
          {teamOptionsForTokenAction().map(team => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
        <select value={holderPlayerId} onChange={e => props.onHolderPlayerIdChange(e.target.value)}>
          <option value="">Holder player</option>
          {playerOptionsForTeam(tokenTeamId).map(player => (
            <option key={player.id} value={player.id}>{player.displayName}</option>
          ))}
        </select>
        <button type="button" onClick={props.onIssueToken} disabled={!fixtureId || !tokenTeamId || !holderPlayerId}>
          Issue
        </button>
        <select value={transferToPlayerId} onChange={e => props.onTransferToPlayerIdChange(e.target.value)}>
          <option value="">Transfer to</option>
          {playerOptionsForTeam(tokenTeamId).map(player => (
            <option key={player.id} value={player.id}>{player.displayName}</option>
          ))}
        </select>
        <button type="button" onClick={props.onTransferToken} disabled={!fixtureId || !tokenTeamId || !transferToPlayerId}>
          Transfer
        </button>
        <select value={acceptPlayerId} onChange={e => props.onAcceptPlayerIdChange(e.target.value)}>
          <option value="">Accept as</option>
          {playerOptionsForTeam(tokenTeamId).map(player => (
            <option key={player.id} value={player.id}>{player.displayName}</option>
          ))}
        </select>
        <button type="button" onClick={props.onAcceptToken} disabled={!fixtureId || !tokenTeamId || !acceptPlayerId}>
          Accept
        </button>
      </div>

      <h3>Active token state</h3>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(selectedTokens, null, 2)}</pre>

      <h2>Captain Sign-off Workflow</h2>
      <div style={formRowStyle}>
        <select value={actingPlayerId} onChange={e => props.onActingPlayerIdChange(e.target.value)} disabled={!fixtureId}>
          <option value="">Select acting token holder</option>
          {acceptedTokens.map(token => {
            const playerName = teams
              .flatMap(team => team.roster ?? [])
              .find(entry => entry.player.id === token.currentHolderPlayerId)?.player.displayName;
            return (
              <option key={token.id} value={token.currentHolderPlayerId}>
                {playerName ?? token.currentHolderPlayerId} (team {token.teamId})
              </option>
            );
          })}
        </select>
        <button type="button" onClick={() => props.onShowSubmitFormChange(current => !current)} disabled={!canSubmit}>
          {showSubmitForm ? 'Cancel submit' : 'Submit result'}
        </button>
        <button type="button" onClick={props.onApproveResult} disabled={!canApproveOrReject}>
          Approve
        </button>
        <input
          placeholder="Reject reason (optional)"
          value={rejectReason}
          onChange={e => props.onRejectReasonChange(e.target.value)}
          style={{ minWidth: 260 }}
        />
        <button type="button" onClick={props.onRejectResult} disabled={!canApproveOrReject}>
          Reject
        </button>
      </div>
      {showSubmitForm && canSubmit ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <input
            type="number"
            min={0}
            value={homeFrames}
            onChange={e => props.onHomeFramesChange(Number(e.target.value))}
            placeholder="Final home frames"
          />
          <input
            type="number"
            min={0}
            value={awayFrames}
            onChange={e => props.onAwayFramesChange(Number(e.target.value))}
            placeholder="Final away frames"
          />
          <button type="button" onClick={props.onSubmitResult}>
            Confirm submit
          </button>
        </div>
      ) : null}
      {submittedResult ? (
        <p>
          Latest submitted result: {submittedResult.homeFrames} - {submittedResult.awayFrames} (submitting team{' '}
          {submittedResult.submittingTeamId})
        </p>
      ) : null}
      {selectedFixture?.state === 'DISPUTED' ? (
        <>
          <h3>Dispute status</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(disputes, null, 2)}</pre>
        </>
      ) : null}

      <h2>Event Ledger</h2>
      <p>Current revision: <strong>{currentRevision}</strong></p>
      <div style={formRowStyle}>
        <input
          type="number"
          min={1}
          value={frameNo}
          onChange={e => props.onFrameNoChange(Number(e.target.value))}
          placeholder="Frame no"
        />
        <select value={winnerTeamId} onChange={e => props.onWinnerTeamIdChange(e.target.value)}>
          <option value="">Winning team</option>
          {teamOptionsForTokenAction().map(team => (
            <option key={team.id} value={team.id}>{team.name}</option>
          ))}
        </select>
        <button type="button" onClick={props.onRecordFrame} disabled={!fixtureId || !winnerTeamId}>
          Record frame
        </button>
      </div>

      <div style={formRowStyle}>
        <input
          type="number"
          min={0}
          value={homeFrames}
          onChange={e => props.onHomeFramesChange(Number(e.target.value))}
          placeholder="Home frames"
        />
        <input
          type="number"
          min={0}
          value={awayFrames}
          onChange={e => props.onAwayFramesChange(Number(e.target.value))}
          placeholder="Away frames"
        />
        <button type="button" onClick={props.onCompleteMatch} disabled={!fixtureId}>
          Complete match
        </button>
      </div>

      <h3>Events</h3>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(events, null, 2)}</pre>
    </main>
  );
}

export function getLatestSubmittedResult(events: MatchEvent[]): SubmittedResult {
  const latestSubmitted = [...events]
    .sort((a, b) => b.revision - a.revision)
    .find(event => event.eventType === 'RESULT_SUBMITTED');
  if (!latestSubmitted) return null;
  const payload = latestSubmitted.payload || {};
  const submittingTeamId =
    typeof payload.submitting_team_id === 'string' ? payload.submitting_team_id : '';
  if (!submittingTeamId) return null;
  const homeFrames = toNonNegativeInt(payload.home_frames);
  const awayFrames = toNonNegativeInt(payload.away_frames);
  return { submittingTeamId, homeFrames, awayFrames };
}

export function getRequiredActionLabel(
  state: Fixture['state'] | undefined,
  canSubmit: boolean,
  canApproveOrReject: boolean,
): string {
  if (!state) return 'Select a fixture';
  if (state === 'LOCKED') return 'No action (locked)';
  if (state === 'DISPUTED') return 'No captain action (disputed)';
  if (state === 'AWAITING_OPPONENT') {
    return canApproveOrReject ? 'Approve or reject required' : 'Awaiting opponent captain';
  }
  if (state === 'SCHEDULED' || state === 'IN_PROGRESS') {
    return canSubmit ? 'Submit result required' : 'Awaiting token holder submit';
  }
  if (state === 'SUBMITTED') return 'Awaiting opponent review';
  return 'No action';
}

export function toNonNegativeInt(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  const int = Math.floor(parsed);
  return int < 0 ? 0 : int;
}

const formRowStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  marginBottom: 8,
};
