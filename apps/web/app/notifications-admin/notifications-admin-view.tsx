import type { CSSProperties } from 'react';

export type NotificationsOutboxItem = {
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

export type NotificationsMonitoringSummary = {
  windowHours: number;
  generatedAt: string;
  totals: {
    pending: number;
    sending: number;
    sent: number;
    failed: number;
  };
  recentFailures: Array<{
    id: string;
    channel: string;
    toMasked: string;
    templateKey: string;
    attempts: number;
    lastError: string | null;
    updatedAt: string;
  }>;
};

type Props = {
  orgId: string;
  statusFilter: string;
  channelFilter: string;
  templateKeyFilter: string;
  monitoringHours: number;
  outbox: NotificationsOutboxItem[];
  monitoring: NotificationsMonitoringSummary | null;
  testChannel: string;
  testTo: string;
  testMessage: string;
  status: string | null;
  error: string | null;
  onOrgIdChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onChannelFilterChange: (value: string) => void;
  onTemplateKeyFilterChange: (value: string) => void;
  onMonitoringHoursChange: (value: number) => void;
  onLoadOutbox: () => void;
  onLoadMonitoring: () => void;
  onTestChannelChange: (value: string) => void;
  onTestToChange: (value: string) => void;
  onTestMessageChange: (value: string) => void;
  onQueueTest: () => void;
};

export function NotificationsAdminView(props: Props) {
  const {
    orgId,
    statusFilter,
    channelFilter,
    templateKeyFilter,
    monitoringHours,
    outbox,
    monitoring,
    testChannel,
    testTo,
    testMessage,
    status,
    error,
  } = props;
  const failedOutbox = outbox.filter(item => item.status === 'failed');
  const pendingOutbox = outbox.filter(item => item.status === 'pending' || item.status === 'sending');
  const otherOutbox = outbox.filter(item => item.status !== 'failed' && item.status !== 'pending' && item.status !== 'sending');

  return (
    <main style={{ padding: 20 }}>
      <h1>Notifications Admin</h1>
      <p>View outbox health, inspect recent delivery failures, and queue test notifications.</p>
      <p>
        <a href="/orgs">Organisations</a> | <a href="/sponsors-admin">Sponsors</a> | <a href="/schedule">Schedule</a> |{' '}
        <a href="/help">Help</a>
      </p>

      <section style={panelStyle}>
        <h2>Outbox filters</h2>
        <div style={rowStyle}>
          <input placeholder="orgId" value={orgId} onChange={e => props.onOrgIdChange(e.target.value)} required />
          <select value={statusFilter} onChange={e => props.onStatusFilterChange(e.target.value)}>
            <option value="">any status</option>
            <option value="pending">pending</option>
            <option value="sending">sending</option>
            <option value="sent">sent</option>
            <option value="failed">failed</option>
          </select>
          <select value={channelFilter} onChange={e => props.onChannelFilterChange(e.target.value)}>
            <option value="">any channel</option>
            <option value="sms">sms</option>
            <option value="whatsapp">whatsapp</option>
            <option value="email">email</option>
          </select>
          <input
            placeholder="templateKey (optional)"
            value={templateKeyFilter}
            onChange={e => props.onTemplateKeyFilterChange(e.target.value)}
          />
          <button type="button" onClick={props.onLoadOutbox} disabled={!orgId}>
            Load outbox
          </button>
        </div>
      </section>

      <section style={panelStyle}>
        <h2>Monitoring</h2>
        <div style={rowStyle}>
          <input
            type="number"
            min={1}
            max={168}
            value={monitoringHours}
            onChange={e => props.onMonitoringHoursChange(Number(e.target.value))}
          />
          <button type="button" onClick={props.onLoadMonitoring} disabled={!orgId}>
            Load monitoring
          </button>
        </div>
        {!monitoring ? <p>No monitoring summary loaded.</p> : null}
        {monitoring ? (
          <>
            <p>
              Window: <strong>{monitoring.windowHours}h</strong> | Generated:{' '}
              <strong>{monitoring.generatedAt}</strong>
            </p>
            <p>
              Pending: <strong>{monitoring.totals.pending}</strong> | Sending:{' '}
              <strong>{monitoring.totals.sending}</strong> | Sent: <strong>{monitoring.totals.sent}</strong> | Failed:{' '}
              <strong>{monitoring.totals.failed}</strong>
            </p>
            <h3>Recent failures</h3>
            {monitoring.recentFailures.length === 0 ? <p>No recent failures in this window.</p> : null}
            {monitoring.recentFailures.length > 0 ? (
              <ul style={{ paddingLeft: 18 }}>
                {monitoring.recentFailures.map(item => (
                  <li key={item.id}>
                    {item.channel} to {item.toMasked} via {item.templateKey} failed after {item.attempts} attempts
                    {item.lastError ? `: ${item.lastError}` : ''} ({item.updatedAt})
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : null}
      </section>

      <section style={panelStyle}>
        <h2>Queue test</h2>
        <div style={rowStyle}>
          <select value={testChannel} onChange={e => props.onTestChannelChange(e.target.value)}>
            <option value="sms">sms</option>
            <option value="whatsapp">whatsapp</option>
            <option value="email">email</option>
          </select>
          <input value={testTo} onChange={e => props.onTestToChange(e.target.value)} placeholder="Recipient" />
          <input value={testMessage} onChange={e => props.onTestMessageChange(e.target.value)} placeholder="Message" />
          <button type="button" onClick={props.onQueueTest} disabled={!orgId}>
            Queue test
          </button>
        </div>
      </section>

      {status ? <p>{status}</p> : null}
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}

      <section style={panelStyle}>
        <h2>Outbox</h2>
        {outbox.length === 0 ? <p>No outbox items loaded.</p> : null}
        {outbox.length > 0 ? (
          <>
            <h3>Needs attention</h3>
            {failedOutbox.length === 0 ? <p>No failed outbox items.</p> : null}
            {failedOutbox.length > 0 ? (
              <ul style={{ paddingLeft: 18 }}>
                {failedOutbox.map(item => (
                  <li key={item.id}>
                    <strong>{item.status}</strong> {item.channel} {item.templateKey} to {item.to} | attempts {item.attempts}
                    {' '}| scheduled {item.scheduledFor}
                    {item.lastError ? ` | error: ${item.lastError}` : ''}
                  </li>
                ))}
              </ul>
            ) : null}

            <h3>Queued or sending</h3>
            {pendingOutbox.length === 0 ? <p>No pending or sending outbox items.</p> : null}
            {pendingOutbox.length > 0 ? (
              <ul style={{ paddingLeft: 18 }}>
                {pendingOutbox.map(item => (
                  <li key={item.id}>
                    <strong>{item.status}</strong> {item.channel} {item.templateKey} to {item.to} | attempts {item.attempts}
                    {' '}| scheduled {item.scheduledFor}
                  </li>
                ))}
              </ul>
            ) : null}

            <h3>Other items</h3>
            {otherOutbox.length === 0 ? <p>No other outbox items.</p> : null}
            {otherOutbox.length > 0 ? (
              <ul style={{ paddingLeft: 18 }}>
                {otherOutbox.map(item => (
                  <li key={item.id}>
                    <strong>{item.status}</strong> {item.channel} {item.templateKey} to {item.to} | attempts {item.attempts}
                    {' '}| scheduled {item.scheduledFor}
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : null}
      </section>
    </main>
  );
}

const panelStyle: CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 10,
  padding: 16,
  marginBottom: 16,
};

const rowStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  alignItems: 'center',
};
