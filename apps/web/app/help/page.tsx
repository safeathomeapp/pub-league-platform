export default function HelpPage() {
  return (
    <main>
      <h1>Help</h1>
      <p>Minimal operator help for local demo/beta usage.</p>

      <h2>Quick Start</h2>
      <pre>{`npm run db:push\nnpm run seed:demo\nnpm run dev`}</pre>

      <h2>Demo Login</h2>
      <p>
        <code>demo.organiser@publeague.local</code> / <code>demo12345</code>
      </p>

      <h2>Main Links</h2>
      <ul>
        <li><a href="/onboarding">Demo Onboarding</a></li>
        <li><a href="/orgs">Organisations</a></li>
        <li><a href="/schedule">Schedule</a></li>
        <li><a href="/match-night">Match Night</a></li>
        <li><a href="/disputes">Disputes</a></li>
        <li><a href="/notifications-admin">Notifications Admin</a></li>
      </ul>

      <h2>Backup Export</h2>
      <p>
        API: <code>GET /api/v1/orgs/:orgId/export</code>
      </p>

      <h2>Messaging Monitoring</h2>
      <p>
        API: <code>GET /api/v1/orgs/:orgId/notifications/monitoring?hours=24</code>
      </p>

      <h2>Runbook</h2>
      <p>
        Full runbook: <code>docs/23-Minimal-Help-and-Runbook.md</code>
      </p>
      <p>
        UAT checklist: <code>docs/24-UAT-Checklist-Beta.md</code>
      </p>
    </main>
  );
}
