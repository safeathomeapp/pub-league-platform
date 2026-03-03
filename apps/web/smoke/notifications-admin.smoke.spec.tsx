import { renderToStaticMarkup } from 'react-dom/server';
import { NotificationsAdminView } from '../app/notifications-admin/notifications-admin-view';

describe('notifications admin smoke', () => {
  it('renders monitoring, failure visibility, and outbox state', () => {
    const html = renderToStaticMarkup(
      <NotificationsAdminView
        orgId="org-123"
        statusFilter="failed"
        channelFilter="sms"
        templateKeyFilter="fixture.completed"
        monitoringHours={24}
        outbox={[
          {
            id: 'outbox-1',
            status: 'failed',
            channel: 'sms',
            to: '+447700900009',
            templateKey: 'fixture.completed',
            attempts: 3,
            lastError: 'Provider outage',
            scheduledFor: '2026-03-03T18:00:00.000Z',
            updatedAt: '2026-03-03T18:01:00.000Z',
          },
          {
            id: 'outbox-2',
            status: 'pending',
            channel: 'sms',
            to: '+447700900010',
            templateKey: 'fixture.reminder',
            attempts: 0,
            lastError: null,
            scheduledFor: '2026-03-04T18:00:00.000Z',
            updatedAt: '2026-03-03T18:01:00.000Z',
          },
          {
            id: 'outbox-3',
            status: 'sent',
            channel: 'email',
            to: 'league@example.com',
            templateKey: 'notifications.test',
            attempts: 1,
            lastError: null,
            scheduledFor: '2026-03-03T17:00:00.000Z',
            updatedAt: '2026-03-03T17:01:00.000Z',
          },
        ]}
        monitoring={{
          windowHours: 24,
          generatedAt: '2026-03-03T18:05:00.000Z',
          totals: { pending: 2, sending: 1, sent: 12, failed: 1 },
          recentFailures: [
            {
              id: 'failure-1',
              channel: 'sms',
              toMasked: '*******0009',
              templateKey: 'fixture.completed',
              attempts: 3,
              lastError: 'Provider outage',
              updatedAt: '2026-03-03T18:01:00.000Z',
            },
          ],
        }}
        testChannel="sms"
        testTo="+447700900009"
        testMessage="Diagnostics ping"
        status="Monitoring loaded"
        error={null}
        onOrgIdChange={() => {}}
        onStatusFilterChange={() => {}}
        onChannelFilterChange={() => {}}
        onTemplateKeyFilterChange={() => {}}
        onMonitoringHoursChange={() => {}}
        onLoadOutbox={() => {}}
        onLoadMonitoring={() => {}}
        onTestChannelChange={() => {}}
        onTestToChange={() => {}}
        onTestMessageChange={() => {}}
        onQueueTest={() => {}}
      />,
    );

    expect(html).toContain('Notifications Admin');
    expect(html).toContain('Outbox filters');
    expect(html).toContain('Monitoring');
    expect(html).toContain('Pending:');
    expect(html).toContain('Recent failures');
    expect(html).toContain('*******0009');
    expect(html).toContain('fixture.completed');
    expect(html).toContain('Provider outage');
    expect(html).toContain('Queue test');
    expect(html).toContain('Needs attention');
    expect(html).toContain('Queued or sending');
    expect(html).toContain('Other items');
    expect(html).toContain('fixture.reminder');
    expect(html).toContain('notifications.test');
    expect(html).not.toContain('No recent failures in this window.');
  });

  it('renders empty monitoring and outbox states', () => {
    const html = renderToStaticMarkup(
      <NotificationsAdminView
        orgId="org-123"
        statusFilter=""
        channelFilter=""
        templateKeyFilter=""
        monitoringHours={24}
        outbox={[]}
        monitoring={null}
        testChannel="sms"
        testTo="+447700900009"
        testMessage="Diagnostics ping"
        status={null}
        error={null}
        onOrgIdChange={() => {}}
        onStatusFilterChange={() => {}}
        onChannelFilterChange={() => {}}
        onTemplateKeyFilterChange={() => {}}
        onMonitoringHoursChange={() => {}}
        onLoadOutbox={() => {}}
        onLoadMonitoring={() => {}}
        onTestChannelChange={() => {}}
        onTestToChange={() => {}}
        onTestMessageChange={() => {}}
        onQueueTest={() => {}}
      />,
    );

    expect(html).toContain('No monitoring summary loaded.');
    expect(html).toContain('No outbox items loaded.');
    expect(html).not.toContain('Needs attention');
  });
});
