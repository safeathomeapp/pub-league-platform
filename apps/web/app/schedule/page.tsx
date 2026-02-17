'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Team = { id: string; name: string };
type Fixture = {
  id: string;
  scheduledAt: string | null;
  status: 'scheduled' | 'in_progress' | 'completed';
  homeTeam: Team;
  awayTeam: Team;
};

function SchedulePageContent() {
  const search = useSearchParams();
  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1',
    [],
  );
  const [orgId, setOrgId] = useState(search.get('orgId') ?? '');
  const [divisionId, setDivisionId] = useState('');
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [icsPreview, setIcsPreview] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  async function loadFixtures(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authFetch(`/orgs/${orgId}/divisions/${divisionId}/fixtures`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to load fixtures');
      setFixtures(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fixtures');
    } finally {
      setLoading(false);
    }
  }

  async function updateFixture(fixtureId: string, scheduledAt: string, status: string) {
    setError(null);
    try {
      const res = await authFetch(`/orgs/${orgId}/fixtures/${fixtureId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to update fixture');
      setFixtures(current => current.map(item => (item.id === fixtureId ? data : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update fixture');
    }
  }

  async function loadDivisionIcs() {
    setError(null);
    try {
      const res = await authFetch(`/orgs/${orgId}/calendar/divisions/${divisionId}.ics`);
      const text = await res.text();
      if (!res.ok) throw new Error('Failed to load division calendar feed');
      setIcsPreview(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load division calendar feed');
    }
  }

  async function loadTeamIcs(teamId: string) {
    setError(null);
    try {
      const res = await authFetch(`/orgs/${orgId}/calendar/teams/${teamId}.ics`);
      const text = await res.text();
      if (!res.ok) throw new Error('Failed to load team calendar feed');
      setIcsPreview(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team calendar feed');
    }
  }

  return (
    <main>
      <h1>Schedule</h1>
      <p>Load a division fixture list, update fixture times/status, and preview .ics feeds.</p>
      <p>
        <a href="/orgs">Back to organisations</a> |{' '}
        <a href={`/match-night?orgId=${orgId}&divisionId=${divisionId}`}>Match Night</a> |{' '}
        <a href={`/disputes?orgId=${orgId}&divisionId=${divisionId}`}>Disputes</a> |{' '}
        <a href={`/standings?orgId=${orgId}&divisionId=${divisionId}`}>Standings</a> |{' '}
        <a href={`/notifications-admin?orgId=${orgId}`}>Notifications Admin</a>
      </p>

      <form onSubmit={loadFixtures} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <input placeholder="orgId" value={orgId} onChange={e => setOrgId(e.target.value)} required />
        <input placeholder="divisionId" value={divisionId} onChange={e => setDivisionId(e.target.value)} required />
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Load fixtures'}
        </button>
        <button type="button" onClick={loadDivisionIcs} disabled={!orgId || !divisionId}>
          Load division .ics
        </button>
      </form>

      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Match</th>
            <th style={{ textAlign: 'left' }}>Status</th>
            <th style={{ textAlign: 'left' }}>Scheduled (UTC)</th>
            <th style={{ textAlign: 'left' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {fixtures.map(fixture => (
            <FixtureRow
              key={fixture.id}
              orgId={orgId}
              divisionId={divisionId}
              fixture={fixture}
              onUpdate={updateFixture}
              onLoadTeamIcs={loadTeamIcs}
            />
          ))}
        </tbody>
      </table>

      {icsPreview ? (
        <>
          <h2>.ics preview</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{icsPreview}</pre>
        </>
      ) : null}
    </main>
  );
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<main><p>Loading schedule...</p></main>}>
      <SchedulePageContent />
    </Suspense>
  );
}

function FixtureRow(props: {
  orgId: string;
  divisionId: string;
  fixture: Fixture;
  onUpdate: (fixtureId: string, scheduledAt: string, status: string) => Promise<void>;
  onLoadTeamIcs: (teamId: string) => Promise<void>;
}) {
  const { orgId, divisionId, fixture, onUpdate, onLoadTeamIcs } = props;
  const [status, setStatus] = useState(fixture.status);
  const [scheduledAt, setScheduledAt] = useState(toDateTimeLocal(fixture.scheduledAt));

  return (
    <tr>
      <td>{fixture.homeTeam.name} vs {fixture.awayTeam.name}</td>
      <td>{fixture.status}</td>
      <td>{fixture.scheduledAt ?? 'Unscheduled'}</td>
      <td>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={e => setScheduledAt(e.target.value)}
          />
          <select value={status} onChange={e => setStatus(e.target.value as Fixture['status'])}>
            <option value="scheduled">scheduled</option>
            <option value="in_progress">in_progress</option>
            <option value="completed">completed</option>
          </select>
          <button type="button" onClick={() => void onUpdate(fixture.id, scheduledAt, status)}>
            Save
          </button>
          <button type="button" onClick={() => void onLoadTeamIcs(fixture.homeTeam.id)}>
            Home .ics
          </button>
          <button type="button" onClick={() => void onLoadTeamIcs(fixture.awayTeam.id)}>
            Away .ics
          </button>
          <a href={`/match-night?orgId=${orgId}&divisionId=${divisionId}&fixtureId=${fixture.id}`}>Match night</a>
          <a href={`/disputes?orgId=${orgId}&divisionId=${divisionId}&fixtureId=${fixture.id}`}>Disputes</a>
        </div>
      </td>
    </tr>
  );
}

function toDateTimeLocal(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  const yyyy = date.getFullYear().toString().padStart(4, '0');
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  const hh = date.getHours().toString().padStart(2, '0');
  const min = date.getMinutes().toString().padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}
