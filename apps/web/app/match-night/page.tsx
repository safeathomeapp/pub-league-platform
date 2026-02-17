'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type TeamPlayer = {
  id: string;
  role: string;
  player: { id: string; displayName: string };
};

type Team = {
  id: string;
  name: string;
  roster?: TeamPlayer[];
};

type Fixture = {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  state: 'SCHEDULED' | 'IN_PROGRESS' | 'SUBMITTED' | 'AWAITING_OPPONENT' | 'DISPUTED' | 'LOCKED';
  status: 'scheduled' | 'in_progress' | 'completed';
};

type MatchEvent = {
  id: string;
  revision: number;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

type MatchToken = {
  id: string;
  fixtureId: string;
  teamId: string;
  currentHolderPlayerId: string;
  issuedAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
};

type Dispute = {
  id: string;
  status: string;
  reason: string | null;
  outcome: string | null;
  createdAt: string;
};

type SubmittedResult = {
  submittingTeamId: string;
  homeFrames: number;
  awayFrames: number;
} | null;

function MatchNightPageContent() {
  const search = useSearchParams();
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1', []);

  const [orgId, setOrgId] = useState(search.get('orgId') ?? '');
  const [divisionId, setDivisionId] = useState(search.get('divisionId') ?? '');
  const [fixtureId, setFixtureId] = useState(search.get('fixtureId') ?? '');
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [tokensByFixture, setTokensByFixture] = useState<Record<string, MatchToken[]>>({});
  const [teams, setTeams] = useState<Team[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [me, setMe] = useState<{ id: string; email: string } | null>(null);
  const [frameNo, setFrameNo] = useState(1);
  const [winnerTeamId, setWinnerTeamId] = useState('');
  const [homeFrames, setHomeFrames] = useState(0);
  const [awayFrames, setAwayFrames] = useState(0);
  const [tokenTeamId, setTokenTeamId] = useState('');
  const [holderPlayerId, setHolderPlayerId] = useState('');
  const [transferToPlayerId, setTransferToPlayerId] = useState('');
  const [acceptPlayerId, setAcceptPlayerId] = useState('');
  const [actingPlayerId, setActingPlayerId] = useState('');
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  async function authFetch(path: string, init?: RequestInit) {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      window.location.href = '/login';
      throw new Error('Not authenticated');
    }

    return fetch(`${apiBase}${path}`, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async function loadSetup(nextFixtureId?: string) {
    setStatus('Loading fixtures, tokens, and team rosters...');
    setError(null);
    try {
      const [fixturesRes, teamsRes, meRes] = await Promise.all([
        authFetch(`/orgs/${orgId}/divisions/${divisionId}/fixtures`),
        authFetch(`/orgs/${orgId}/divisions/${divisionId}/teams`),
        authFetch('/auth/me'),
      ]);
      const fixturesData = await fixturesRes.json();
      const teamsData = await teamsRes.json();
      const meData = await meRes.json();
      if (!fixturesRes.ok) throw new Error(fixturesData?.error?.message ?? 'Failed to load fixtures');
      if (!teamsRes.ok) throw new Error(teamsData?.error?.message ?? 'Failed to load teams');
      if (!meRes.ok) throw new Error(meData?.error?.message ?? 'Failed to load authenticated user');

      const fixtureList = fixturesData as Fixture[];
      const teamList = teamsData as Team[];
      setFixtures(fixtureList);
      setTeams(teamList);
      setMe(meData.user ?? null);

      const tokenResponses = await Promise.all(
        fixtureList.map(async fixture => {
          const res = await authFetch(`/orgs/${orgId}/fixtures/${fixture.id}/tokens`);
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error?.message ?? `Failed to load tokens for fixture ${fixture.id}`);
          return [fixture.id, data as MatchToken[]] as const;
        }),
      );
      const nextTokenMap: Record<string, MatchToken[]> = {};
      for (const [id, tokenList] of tokenResponses) nextTokenMap[id] = tokenList;
      setTokensByFixture(nextTokenMap);

      const initialFixtureId = nextFixtureId || fixtureId || fixtureList[0]?.id || '';
      if (initialFixtureId) {
        setFixtureId(initialFixtureId);
        await loadFixtureData(initialFixtureId, fixtureList, nextTokenMap);
      } else {
        setFixtureId('');
        setEvents([]);
        setDisputes([]);
      }

      setStatus('Loaded');
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : 'Failed to load setup');
    }
  }

  async function loadFixtureData(
    nextFixtureId = fixtureId,
    fixtureList = fixtures,
    tokenMap = tokensByFixture,
  ) {
    if (!orgId || !nextFixtureId) return;
    setStatus('Loading fixture details...');
    setError(null);
    try {
      const eventsRes = await authFetch(`/orgs/${orgId}/fixtures/${nextFixtureId}/events`);
      const eventsData = await eventsRes.json();
      if (!eventsRes.ok) throw new Error(eventsData?.error?.message ?? 'Failed to load events');
      setEvents(eventsData);

      const fixture = fixtureList.find(item => item.id === nextFixtureId);
      const initialTeam = fixture?.homeTeam.id || '';
      setTokenTeamId(initialTeam);
      if (initialTeam) {
        const rosterPlayers = (teams.find(item => item.id === initialTeam)?.roster ?? []).map(entry => entry.player.id);
        setHolderPlayerId(rosterPlayers[0] ?? '');
        setTransferToPlayerId(rosterPlayers[1] ?? rosterPlayers[0] ?? '');
        setAcceptPlayerId(rosterPlayers[0] ?? '');
        setWinnerTeamId(fixture?.homeTeam.id ?? '');
      }
      const fixtureTokens = tokenMap[nextFixtureId] ?? [];
      const defaultActingToken = fixtureTokens.find(token => !token.revokedAt && token.acceptedAt);
      if (defaultActingToken) setActingPlayerId(defaultActingToken.currentHolderPlayerId);

      if (fixture?.state === 'DISPUTED') {
        const disputesRes = await authFetch(`/orgs/${orgId}/fixtures/${nextFixtureId}/disputes`);
        const disputesData = await disputesRes.json();
        if (!disputesRes.ok) throw new Error(disputesData?.error?.message ?? 'Failed to load disputes');
        setDisputes(disputesData as Dispute[]);
      } else {
        setDisputes([]);
      }

      setStatus('Fixture loaded');
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : 'Failed to load fixture data');
    }
  }

  async function postJson(path: string, body: Record<string, unknown>, okMessage: string) {
    setStatus('Submitting...');
    setError(null);
    try {
      const res = await authFetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? 'Request failed');
      await loadSetup(fixtureId);
      setStatus(okMessage);
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : 'Request failed');
    }
  }

  function teamOptionsForTokenAction() {
    if (!selectedFixture) return [];
    return [selectedFixture.homeTeam, selectedFixture.awayTeam];
  }

  function playerOptionsForTeam(teamId: string) {
    return (teams.find(team => team.id === teamId)?.roster ?? []).map(entry => entry.player);
  }

  function onLoadSetupSubmit(e: React.FormEvent) {
    e.preventDefault();
    void loadSetup();
  }

  async function submitResult() {
    if (!selectedFixture || !actingToken) return;
    await postJson(
      `/orgs/${orgId}/fixtures/${selectedFixture.id}/submit`,
      {
        expectedRevision: currentRevision,
        homeFrames,
        awayFrames,
        teamId: actingToken.teamId,
        actorPlayerId: actingToken.currentHolderPlayerId,
      },
      'Result submitted',
    );
    setShowSubmitForm(false);
  }

  async function approveResult() {
    if (!selectedFixture || !actingToken) return;
    await postJson(
      `/orgs/${orgId}/fixtures/${selectedFixture.id}/approve`,
      {
        expectedRevision: currentRevision,
        teamId: actingToken.teamId,
        actorPlayerId: actingToken.currentHolderPlayerId,
      },
      'Result approved and fixture locked',
    );
  }

  async function rejectResult() {
    if (!selectedFixture || !actingToken) return;
    await postJson(
      `/orgs/${orgId}/fixtures/${selectedFixture.id}/reject`,
      {
        expectedRevision: currentRevision,
        teamId: actingToken.teamId,
        actorPlayerId: actingToken.currentHolderPlayerId,
        ...(rejectReason.trim() ? { reason: rejectReason.trim() } : {}),
      },
      'Result rejected and dispute opened',
    );
    setRejectReason('');
  }

  const requiredAction = getRequiredActionLabel(selectedFixture?.state, canSubmit, canApproveOrReject);

  return (
    <main>
      <h1>Match Night</h1>
      <p>Issue/transfer/accept tokens, submit results, and opponent sign-off.</p>
      <p>
        <a href="/orgs">Organisations</a> | <a href="/schedule">Schedule</a> | <a href="/disputes">Disputes</a> |{' '}
        <a href="/notifications-admin">Notifications Admin</a>
      </p>

      <form onSubmit={onLoadSetupSubmit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <input placeholder="orgId" value={orgId} onChange={e => setOrgId(e.target.value)} required />
        <input placeholder="divisionId" value={divisionId} onChange={e => setDivisionId(e.target.value)} required />
        <button type="submit">Load setup</button>
      </form>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <label htmlFor="fixtureId">Fixture</label>
        <select
          id="fixtureId"
          value={fixtureId}
          onChange={e => {
            const next = e.target.value;
            setFixtureId(next);
            void loadFixtureData(next);
          }}
        >
          <option value="">Select fixture</option>
          {fixtures.map(item => (
            <option key={item.id} value={item.id}>
              {item.homeTeam.name} vs {item.awayTeam.name} ({item.status})
            </option>
          ))}
        </select>
        <button type="button" onClick={() => void loadFixtureData()} disabled={!fixtureId}>
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
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <select value={tokenTeamId} onChange={e => setTokenTeamId(e.target.value)}>
          <option value="">Select team</option>
          {teamOptionsForTokenAction().map(team => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
        <select value={holderPlayerId} onChange={e => setHolderPlayerId(e.target.value)}>
          <option value="">Holder player</option>
          {playerOptionsForTeam(tokenTeamId).map(player => (
            <option key={player.id} value={player.id}>{player.displayName}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() =>
            void postJson(
              `/orgs/${orgId}/fixtures/${fixtureId}/tokens:issue`,
              { teamId: tokenTeamId, holderPlayerId },
              'Token issued',
            )
          }
          disabled={!fixtureId || !tokenTeamId || !holderPlayerId}
        >
          Issue
        </button>
        <select value={transferToPlayerId} onChange={e => setTransferToPlayerId(e.target.value)}>
          <option value="">Transfer to</option>
          {playerOptionsForTeam(tokenTeamId).map(player => (
            <option key={player.id} value={player.id}>{player.displayName}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() =>
            void postJson(
              `/orgs/${orgId}/fixtures/${fixtureId}/tokens:transfer`,
              { teamId: tokenTeamId, toPlayerId: transferToPlayerId },
              'Token transferred',
            )
          }
          disabled={!fixtureId || !tokenTeamId || !transferToPlayerId}
        >
          Transfer
        </button>
        <select value={acceptPlayerId} onChange={e => setAcceptPlayerId(e.target.value)}>
          <option value="">Accept as</option>
          {playerOptionsForTeam(tokenTeamId).map(player => (
            <option key={player.id} value={player.id}>{player.displayName}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() =>
            void postJson(
              `/orgs/${orgId}/fixtures/${fixtureId}/tokens:accept`,
              { teamId: tokenTeamId, playerId: acceptPlayerId },
              'Token accepted',
            )
          }
          disabled={!fixtureId || !tokenTeamId || !acceptPlayerId}
        >
          Accept
        </button>
      </div>

      <h3>Active token state</h3>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(selectedTokens, null, 2)}</pre>

      <h2>Captain Sign-off Workflow</h2>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <select value={actingPlayerId} onChange={e => setActingPlayerId(e.target.value)} disabled={!fixtureId}>
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
        <button type="button" onClick={() => setShowSubmitForm(current => !current)} disabled={!canSubmit}>
          {showSubmitForm ? 'Cancel submit' : 'Submit result'}
        </button>
        <button type="button" onClick={() => void approveResult()} disabled={!canApproveOrReject}>
          Approve
        </button>
        <input
          placeholder="Reject reason (optional)"
          value={rejectReason}
          onChange={e => setRejectReason(e.target.value)}
          style={{ minWidth: 260 }}
        />
        <button type="button" onClick={() => void rejectResult()} disabled={!canApproveOrReject}>
          Reject
        </button>
      </div>
      {showSubmitForm && canSubmit ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <input
            type="number"
            min={0}
            value={homeFrames}
            onChange={e => setHomeFrames(Number(e.target.value))}
            placeholder="Final home frames"
          />
          <input
            type="number"
            min={0}
            value={awayFrames}
            onChange={e => setAwayFrames(Number(e.target.value))}
            placeholder="Final away frames"
          />
          <button type="button" onClick={() => void submitResult()}>
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
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <input
          type="number"
          min={1}
          value={frameNo}
          onChange={e => setFrameNo(Number(e.target.value))}
          placeholder="Frame no"
        />
        <select value={winnerTeamId} onChange={e => setWinnerTeamId(e.target.value)}>
          <option value="">Winning team</option>
          {teamOptionsForTokenAction().map(team => (
            <option key={team.id} value={team.id}>{team.name}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() =>
            void postJson(
              `/orgs/${orgId}/fixtures/${fixtureId}/events`,
              {
                eventType: 'FRAME_RECORDED',
                expectedRevision: currentRevision,
                payload: { frame_no: frameNo, winner_team_id: winnerTeamId },
              },
              'Frame recorded',
            )
          }
          disabled={!fixtureId || !winnerTeamId}
        >
          Record frame
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <input
          type="number"
          min={0}
          value={homeFrames}
          onChange={e => setHomeFrames(Number(e.target.value))}
          placeholder="Home frames"
        />
        <input
          type="number"
          min={0}
          value={awayFrames}
          onChange={e => setAwayFrames(Number(e.target.value))}
          placeholder="Away frames"
        />
        <button
          type="button"
          onClick={() =>
            void postJson(
              `/orgs/${orgId}/fixtures/${fixtureId}/complete`,
              {
                expectedRevision: currentRevision,
                homeFrames,
                awayFrames,
              },
              'Match completed',
            )
          }
          disabled={!fixtureId}
        >
          Complete match
        </button>
      </div>

      <h3>Events</h3>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(events, null, 2)}</pre>
    </main>
  );
}

function getLatestSubmittedResult(events: MatchEvent[]): SubmittedResult {
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

function getRequiredActionLabel(
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

function toNonNegativeInt(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  const int = Math.floor(parsed);
  return int < 0 ? 0 : int;
}

export default function MatchNightPage() {
  return (
    <Suspense fallback={<main><p>Loading match night...</p></main>}>
      <MatchNightPageContent />
    </Suspense>
  );
}
