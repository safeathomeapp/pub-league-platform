'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Fixture = {
  id: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
};

type Dispute = {
  id: string;
  status: string;
  reason: string | null;
  outcome: string | null;
  createdAt: string;
};

export default function DisputesPage() {
  const search = useSearchParams();
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1', []);

  const [orgId, setOrgId] = useState(search.get('orgId') ?? '');
  const [divisionId, setDivisionId] = useState(search.get('divisionId') ?? '');
  const [fixtureId, setFixtureId] = useState(search.get('fixtureId') ?? '');
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [reason, setReason] = useState('');
  const [resolutionStatus, setResolutionStatus] = useState('resolved');
  const [outcome, setOutcome] = useState('');
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

  async function loadFixtures(e?: React.FormEvent) {
    e?.preventDefault();
    setStatus('Loading fixtures...');
    setError(null);
    try {
      const res = await authFetch(`/orgs/${orgId}/divisions/${divisionId}/fixtures`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to load fixtures');
      setFixtures(data);
      const initialFixture = fixtureId || data[0]?.id || '';
      setFixtureId(initialFixture);
      if (initialFixture) {
        await loadDisputes(initialFixture);
      }
      setStatus('Fixtures loaded');
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : 'Failed to load fixtures');
    }
  }

  async function loadDisputes(nextFixtureId = fixtureId) {
    if (!orgId || !nextFixtureId) return;
    setStatus('Loading disputes...');
    setError(null);
    try {
      const res = await authFetch(`/orgs/${orgId}/fixtures/${nextFixtureId}/disputes`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to load disputes');
      setDisputes(data);
      setStatus('Disputes loaded');
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : 'Failed to load disputes');
    }
  }

  async function createDispute() {
    setStatus('Creating dispute...');
    setError(null);
    try {
      const res = await authFetch(`/orgs/${orgId}/fixtures/${fixtureId}/disputes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to create dispute');
      setReason('');
      await loadDisputes();
      setStatus('Dispute created');
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : 'Failed to create dispute');
    }
  }

  async function resolveDispute(disputeId: string) {
    setStatus('Updating dispute...');
    setError(null);
    try {
      const res = await authFetch(`/orgs/${orgId}/disputes/${disputeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: resolutionStatus, outcome }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to update dispute');
      await loadDisputes();
      setStatus(`Dispute ${data.status}`);
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : 'Failed to update dispute');
    }
  }

  return (
    <main>
      <h1>Disputes</h1>
      <p>Create disputes, review status, and resolve with an outcome note.</p>
      <p>
        <a href="/orgs">Organisations</a> | <a href="/schedule">Schedule</a> | <a href="/match-night">Match Night</a>
      </p>

      <form onSubmit={loadFixtures} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <input placeholder="orgId" value={orgId} onChange={e => setOrgId(e.target.value)} required />
        <input placeholder="divisionId" value={divisionId} onChange={e => setDivisionId(e.target.value)} required />
        <button type="submit">Load fixtures</button>
      </form>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <select
          value={fixtureId}
          onChange={e => {
            const next = e.target.value;
            setFixtureId(next);
            void loadDisputes(next);
          }}
        >
          <option value="">Select fixture</option>
          {fixtures.map(item => (
            <option key={item.id} value={item.id}>
              {item.homeTeam.name} vs {item.awayTeam.name}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => void loadDisputes()} disabled={!fixtureId}>
          Refresh disputes
        </button>
      </div>

      {status ? <p>{status}</p> : null}
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}

      <h2>Create dispute</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          placeholder="Reason"
          value={reason}
          onChange={e => setReason(e.target.value)}
          style={{ minWidth: 360 }}
        />
        <button type="button" onClick={() => void createDispute()} disabled={!fixtureId || reason.length < 3}>
          Create
        </button>
      </div>

      <h2>Current disputes</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <select value={resolutionStatus} onChange={e => setResolutionStatus(e.target.value)}>
          <option value="under_review">under_review</option>
          <option value="resolved">resolved</option>
          <option value="rejected">rejected</option>
          <option value="open">open</option>
        </select>
        <input
          placeholder="Outcome / resolution note"
          value={outcome}
          onChange={e => setOutcome(e.target.value)}
          style={{ minWidth: 360 }}
        />
      </div>

      <ul>
        {disputes.map(dispute => (
          <li key={dispute.id} style={{ marginBottom: 8 }}>
            <strong>{dispute.status}</strong> | {dispute.reason ?? 'No reason'} | {dispute.outcome ?? 'No outcome'}{' '}
            <button type="button" onClick={() => void resolveDispute(dispute.id)}>
              Update
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
