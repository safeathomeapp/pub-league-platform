'use client';

import { useMemo, useState } from 'react';
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
  status: 'scheduled' | 'in_progress' | 'completed';
};

type MatchEvent = {
  id: string;
  revision: number;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export default function MatchNightPage() {
  const search = useSearchParams();
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1', []);

  const [orgId, setOrgId] = useState(search.get('orgId') ?? '');
  const [divisionId, setDivisionId] = useState(search.get('divisionId') ?? '');
  const [fixtureId, setFixtureId] = useState(search.get('fixtureId') ?? '');
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [tokens, setTokens] = useState<any[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [frameNo, setFrameNo] = useState(1);
  const [winnerTeamId, setWinnerTeamId] = useState('');
  const [homeFrames, setHomeFrames] = useState(0);
  const [awayFrames, setAwayFrames] = useState(0);
  const [tokenTeamId, setTokenTeamId] = useState('');
  const [holderPlayerId, setHolderPlayerId] = useState('');
  const [transferToPlayerId, setTransferToPlayerId] = useState('');
  const [acceptPlayerId, setAcceptPlayerId] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedFixture = fixtures.find(item => item.id === fixtureId);
  const currentRevision = events.length ? Math.max(...events.map(item => item.revision)) : 0;

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

  async function loadSetup(e?: React.FormEvent) {
    e?.preventDefault();
    setStatus('Loading fixtures and team rosters...');
    setError(null);
    try {
      const [fixturesRes, teamsRes] = await Promise.all([
        authFetch(`/orgs/${orgId}/divisions/${divisionId}/fixtures`),
        authFetch(`/orgs/${orgId}/divisions/${divisionId}/teams`),
      ]);
      const fixturesData = await fixturesRes.json();
      const teamsData = await teamsRes.json();
      if (!fixturesRes.ok) throw new Error(fixturesData?.error?.message ?? 'Failed to load fixtures');
      if (!teamsRes.ok) throw new Error(teamsData?.error?.message ?? 'Failed to load teams');

      setFixtures(fixturesData);
      setTeams(teamsData);

      const initialFixtureId = fixtureId || fixturesData[0]?.id || '';
      setFixtureId(initialFixtureId);
      if (initialFixtureId) {
        await loadFixtureData(initialFixtureId);
      }
      setStatus('Loaded');
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : 'Failed to load setup');
    }
  }

  async function loadFixtureData(nextFixtureId = fixtureId) {
    if (!orgId || !nextFixtureId) return;
    setStatus('Loading fixture events/tokens...');
    setError(null);
    try {
      const [eventsRes, tokensRes] = await Promise.all([
        authFetch(`/orgs/${orgId}/fixtures/${nextFixtureId}/events`),
        authFetch(`/orgs/${orgId}/fixtures/${nextFixtureId}/tokens`),
      ]);
      const eventsData = await eventsRes.json();
      const tokensData = await tokensRes.json();
      if (!eventsRes.ok) throw new Error(eventsData?.error?.message ?? 'Failed to load events');
      if (!tokensRes.ok) throw new Error(tokensData?.error?.message ?? 'Failed to load tokens');
      setEvents(eventsData);
      setTokens(tokensData);

      const fixture = fixtures.find(item => item.id === nextFixtureId);
      const initialTeam = fixture?.homeTeam.id || '';
      setTokenTeamId(initialTeam);
      if (initialTeam) {
        const rosterPlayers = (teams.find(item => item.id === initialTeam)?.roster ?? []).map(entry => entry.player.id);
        setHolderPlayerId(rosterPlayers[0] ?? '');
        setTransferToPlayerId(rosterPlayers[1] ?? rosterPlayers[0] ?? '');
        setAcceptPlayerId(rosterPlayers[0] ?? '');
        setWinnerTeamId(fixture?.homeTeam.id ?? '');
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
      await loadFixtureData();
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

  return (
    <main>
      <h1>Match Night</h1>
      <p>Issue/transfer/accept tokens, record frame events, and complete fixtures.</p>
      <p>
        <a href="/orgs">Organisations</a> | <a href="/schedule">Schedule</a> | <a href="/disputes">Disputes</a> |{' '}
        <a href="/notifications-admin">Notifications Admin</a>
      </p>

      <form onSubmit={loadSetup} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
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
          Refresh events/tokens
        </button>
      </div>

      {status ? <p>{status}</p> : null}
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}

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
      <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(tokens, null, 2)}</pre>

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
