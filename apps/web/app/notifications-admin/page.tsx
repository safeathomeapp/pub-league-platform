'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type OutboxItem = {
  id: string;
  status: string;
  channel: string;
  to: string;
  templateKey: string;
  attempts: number;
  lastError: string | null;
  scheduledFor: string;
  updatedAt: string;
};

function NotificationsAdminPageContent() {
  const search = useSearchParams();
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1', []);

  const [orgId, setOrgId] = useState(search.get('orgId') ?? '');
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [templateKeyFilter, setTemplateKeyFilter] = useState('');
  const [monitoringHours, setMonitoringHours] = useState(24);
  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const [monitoring, setMonitoring] = useState<any>(null);
  const [testChannel, setTestChannel] = useState('sms');
  const [testTo, setTestTo] = useState('+447700900009');
  const [testMessage, setTestMessage] = useState('Beta test ping');
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

  async function loadOutbox() {
    setStatus('Loading outbox...');
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (channelFilter) params.set('channel', channelFilter);
      if (templateKeyFilter) params.set('templateKey', templateKeyFilter);

      const res = await authFetch(`/orgs/${orgId}/notifications/outbox${params.toString() ? `?${params}` : ''}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to load outbox');
      setOutbox(data);
      setStatus('Outbox loaded');
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : 'Failed to load outbox');
    }
  }

  async function loadMonitoring() {
    setStatus('Loading monitoring summary...');
    setError(null);
    try {
      const res = await authFetch(`/orgs/${orgId}/notifications/monitoring?hours=${monitoringHours}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to load monitoring');
      setMonitoring(data);
      setStatus('Monitoring loaded');
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : 'Failed to load monitoring');
    }
  }

  async function queueTestNotification() {
    setStatus('Queueing test notification...');
    setError(null);
    try {
      const res = await authFetch(`/orgs/${orgId}/notifications/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: testChannel, to: testTo, message: testMessage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to queue test notification');
      setStatus('Queued');
      await loadOutbox();
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : 'Failed to queue test notification');
    }
  }

  return (
    <main>
      <h1>Notifications Admin</h1>
      <p>View outbox, monitor failures, and queue test messages.</p>
      <p>
        <a href="/orgs">Organisations</a> | <a href="/sponsors-admin">Sponsors</a> | <a href="/schedule">Schedule</a> | <a href="/help">Help</a>
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <input placeholder="orgId" value={orgId} onChange={e => setOrgId(e.target.value)} required />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">any status</option>
          <option value="pending">pending</option>
          <option value="sending">sending</option>
          <option value="sent">sent</option>
          <option value="failed">failed</option>
        </select>
        <select value={channelFilter} onChange={e => setChannelFilter(e.target.value)}>
          <option value="">any channel</option>
          <option value="sms">sms</option>
          <option value="whatsapp">whatsapp</option>
          <option value="email">email</option>
        </select>
        <input
          placeholder="templateKey (optional)"
          value={templateKeyFilter}
          onChange={e => setTemplateKeyFilter(e.target.value)}
        />
        <button type="button" onClick={() => void loadOutbox()} disabled={!orgId}>Load outbox</button>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <input
          type="number"
          min={1}
          max={168}
          value={monitoringHours}
          onChange={e => setMonitoringHours(Number(e.target.value))}
        />
        <button type="button" onClick={() => void loadMonitoring()} disabled={!orgId}>
          Load monitoring
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <select value={testChannel} onChange={e => setTestChannel(e.target.value)}>
          <option value="sms">sms</option>
          <option value="whatsapp">whatsapp</option>
          <option value="email">email</option>
        </select>
        <input value={testTo} onChange={e => setTestTo(e.target.value)} placeholder="Recipient" />
        <input value={testMessage} onChange={e => setTestMessage(e.target.value)} placeholder="Message" />
        <button type="button" onClick={() => void queueTestNotification()} disabled={!orgId}>
          Queue test
        </button>
      </div>

      {status ? <p>{status}</p> : null}
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}

      <h2>Monitoring summary</h2>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(monitoring, null, 2)}</pre>

      <h2>Outbox</h2>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(outbox, null, 2)}</pre>
    </main>
  );
}

export default function NotificationsAdminPage() {
  return (
    <Suspense fallback={<main><p>Loading notifications admin...</p></main>}>
      <NotificationsAdminPageContent />
    </Suspense>
  );
}
