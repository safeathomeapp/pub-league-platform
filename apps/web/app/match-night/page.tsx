'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  MatchNightView,
  type Dispute,
  type Fixture,
  type MatchEvent,
  type MatchToken,
  type Team,
} from './match-night-view';

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
        await loadFixtureData(initialFixtureId, fixtureList, nextTokenMap, teamList);
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
    teamList = teams,
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
        const rosterPlayers = (teamList.find(item => item.id === initialTeam)?.roster ?? []).map(entry => entry.player.id);
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

  function currentRevision() {
    return events.length ? Math.max(...events.map(item => item.revision)) : 0;
  }

  function currentActingToken() {
    const selectedTokens = tokensByFixture[fixtureId] ?? [];
    return selectedTokens
      .filter(token => !token.revokedAt && token.acceptedAt)
      .find(token => token.currentHolderPlayerId === actingPlayerId);
  }

  async function submitResult() {
    const actingToken = currentActingToken();
    if (!fixtureId || !actingToken) return;
    await postJson(
      `/orgs/${orgId}/fixtures/${fixtureId}/submit`,
      {
        expectedRevision: currentRevision(),
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
    const actingToken = currentActingToken();
    if (!fixtureId || !actingToken) return;
    await postJson(
      `/orgs/${orgId}/fixtures/${fixtureId}/approve`,
      {
        expectedRevision: currentRevision(),
        teamId: actingToken.teamId,
        actorPlayerId: actingToken.currentHolderPlayerId,
      },
      'Result approved and fixture locked',
    );
  }

  async function rejectResult() {
    const actingToken = currentActingToken();
    if (!fixtureId || !actingToken) return;
    await postJson(
      `/orgs/${orgId}/fixtures/${fixtureId}/reject`,
      {
        expectedRevision: currentRevision(),
        teamId: actingToken.teamId,
        actorPlayerId: actingToken.currentHolderPlayerId,
        ...(rejectReason.trim() ? { reason: rejectReason.trim() } : {}),
      },
      'Result rejected and dispute opened',
    );
    setRejectReason('');
  }

  return (
    <MatchNightView
      orgId={orgId}
      divisionId={divisionId}
      fixtureId={fixtureId}
      fixtures={fixtures}
      events={events}
      tokensByFixture={tokensByFixture}
      teams={teams}
      disputes={disputes}
      me={me}
      frameNo={frameNo}
      winnerTeamId={winnerTeamId}
      homeFrames={homeFrames}
      awayFrames={awayFrames}
      tokenTeamId={tokenTeamId}
      holderPlayerId={holderPlayerId}
      transferToPlayerId={transferToPlayerId}
      acceptPlayerId={acceptPlayerId}
      actingPlayerId={actingPlayerId}
      showSubmitForm={showSubmitForm}
      rejectReason={rejectReason}
      status={status}
      error={error}
      onOrgIdChange={setOrgId}
      onDivisionIdChange={setDivisionId}
      onFixtureIdChange={value => {
        setFixtureId(value);
        void loadFixtureData(value);
      }}
      onLoadSetup={event => {
        event.preventDefault();
        void loadSetup();
      }}
      onRefreshFixture={() => void loadFixtureData()}
      onTokenTeamIdChange={setTokenTeamId}
      onHolderPlayerIdChange={setHolderPlayerId}
      onTransferToPlayerIdChange={setTransferToPlayerId}
      onAcceptPlayerIdChange={setAcceptPlayerId}
      onActingPlayerIdChange={setActingPlayerId}
      onShowSubmitFormChange={setShowSubmitForm}
      onRejectReasonChange={setRejectReason}
      onFrameNoChange={setFrameNo}
      onWinnerTeamIdChange={setWinnerTeamId}
      onHomeFramesChange={setHomeFrames}
      onAwayFramesChange={setAwayFrames}
      onIssueToken={() =>
        void postJson(
          `/orgs/${orgId}/fixtures/${fixtureId}/tokens:issue`,
          { teamId: tokenTeamId, holderPlayerId },
          'Token issued',
        )
      }
      onTransferToken={() =>
        void postJson(
          `/orgs/${orgId}/fixtures/${fixtureId}/tokens:transfer`,
          { teamId: tokenTeamId, toPlayerId: transferToPlayerId },
          'Token transferred',
        )
      }
      onAcceptToken={() =>
        void postJson(
          `/orgs/${orgId}/fixtures/${fixtureId}/tokens:accept`,
          { teamId: tokenTeamId, playerId: acceptPlayerId },
          'Token accepted',
        )
      }
      onSubmitResult={() => void submitResult()}
      onApproveResult={() => void approveResult()}
      onRejectResult={() => void rejectResult()}
      onRecordFrame={() =>
        void postJson(
          `/orgs/${orgId}/fixtures/${fixtureId}/events`,
          {
            eventType: 'FRAME_RECORDED',
            expectedRevision: currentRevision(),
            payload: { frame_no: frameNo, winner_team_id: winnerTeamId },
          },
          'Frame recorded',
        )
      }
      onCompleteMatch={() =>
        void postJson(
          `/orgs/${orgId}/fixtures/${fixtureId}/complete`,
          {
            expectedRevision: currentRevision(),
            homeFrames,
            awayFrames,
          },
          'Match completed',
        )
      }
    />
  );
}

export default function MatchNightPage() {
  return (
    <Suspense fallback={<main><p>Loading match night...</p></main>}>
      <MatchNightPageContent />
    </Suspense>
  );
}
