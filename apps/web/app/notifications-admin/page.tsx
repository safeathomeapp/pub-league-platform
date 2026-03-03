'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  NotificationsAdminView,
  type NotificationsMonitoringSummary,
  type NotificationsOutboxItem,
} from './notifications-admin-view';

function NotificationsAdminPageContent() {
  const search = useSearchParams();
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1', []);

  const [orgId, setOrgId] = useState(search.get('orgId') ?? '');
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [templateKeyFilter, setTemplateKeyFilter] = useState('');
  const [monitoringHours, setMonitoringHours] = useState(24);
  const [outbox, setOutbox] = useState<NotificationsOutboxItem[]>([]);
  const [monitoring, setMonitoring] = useState<NotificationsMonitoringSummary | null>(null);
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
    <NotificationsAdminView
      orgId={orgId}
      statusFilter={statusFilter}
      channelFilter={channelFilter}
      templateKeyFilter={templateKeyFilter}
      monitoringHours={monitoringHours}
      outbox={outbox}
      monitoring={monitoring}
      testChannel={testChannel}
      testTo={testTo}
      testMessage={testMessage}
      status={status}
      error={error}
      onOrgIdChange={setOrgId}
      onStatusFilterChange={setStatusFilter}
      onChannelFilterChange={setChannelFilter}
      onTemplateKeyFilterChange={setTemplateKeyFilter}
      onMonitoringHoursChange={setMonitoringHours}
      onLoadOutbox={() => void loadOutbox()}
      onLoadMonitoring={() => void loadMonitoring()}
      onTestChannelChange={setTestChannel}
      onTestToChange={setTestTo}
      onTestMessageChange={setTestMessage}
      onQueueTest={() => void queueTestNotification()}
    />
  );
}

export default function NotificationsAdminPage() {
  return (
    <Suspense fallback={<main><p>Loading notifications admin...</p></main>}>
      <NotificationsAdminPageContent />
    </Suspense>
  );
}
