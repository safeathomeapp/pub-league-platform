'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DisputesView, type DisputeFixture, type DisputeRecord } from './disputes-view';

function DisputesPageContent() {
  const search = useSearchParams();
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1', []);

  const [orgId, setOrgId] = useState(search.get('orgId') ?? '');
  const [divisionId, setDivisionId] = useState(search.get('divisionId') ?? '');
  const [fixtureId, setFixtureId] = useState(search.get('fixtureId') ?? '');
  const [fixtures, setFixtures] = useState<DisputeFixture[]>([]);
  const [disputes, setDisputes] = useState<DisputeRecord[]>([]);
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
    <DisputesView
      orgId={orgId}
      divisionId={divisionId}
      fixtureId={fixtureId}
      fixtures={fixtures}
      disputes={disputes}
      reason={reason}
      resolutionStatus={resolutionStatus}
      outcome={outcome}
      status={status}
      error={error}
      onOrgIdChange={setOrgId}
      onDivisionIdChange={setDivisionId}
      onFixtureIdChange={value => {
        setFixtureId(value);
        void loadDisputes(value);
      }}
      onReasonChange={setReason}
      onResolutionStatusChange={setResolutionStatus}
      onOutcomeChange={setOutcome}
      onLoadFixtures={event => {
        event.preventDefault();
        void loadFixtures();
      }}
      onRefreshDisputes={() => void loadDisputes()}
      onCreateDispute={() => void createDispute()}
      onResolveDispute={disputeId => void resolveDispute(disputeId)}
    />
  );
}

export default function DisputesPage() {
  return (
    <Suspense fallback={<main><p>Loading disputes...</p></main>}>
      <DisputesPageContent />
    </Suspense>
  );
}
