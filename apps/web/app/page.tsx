import { getServerApiBaseUrl } from '../lib/server-api';

async function getHealth() {
  const base = getServerApiBaseUrl();
  try {
    const res = await fetch(`${base}/health`, { cache: "no-store" });
    return await res.json();
  } catch {
    return { ok: false };
  }
}

export default async function Home() {
  const health = await getHealth();

  return (
    <main>
      <h1>Pub League Platform</h1>
      <p>Admin-first league management (UK).</p>
      <p>
        <a href="/login">Login</a> | <a href="/register">Register</a> | <a href="/orgs">Organisations</a> |{' '}
        <a href="/schedule">Schedule</a> | <a href="/match-night">Match Night</a> | <a href="/disputes">Disputes</a> |{' '}
        <a href="/standings">Standings</a> | <a href="/notifications-admin">Notifications</a> |{' '}
        <a href="/sponsors-admin">Sponsors</a> | <a href="/tv-overlay">TV Overlay</a> |{' '}
        <a href="/migration-assistant">Migration Assistant</a> |{' '}
        <a href="/onboarding">Demo Onboarding</a> | <a href="/help">Help</a>
      </p>
      <h2>API health</h2>
      <pre>{JSON.stringify(health, null, 2)}</pre>
      <p>
        Next steps: implement auth, orgs, leagues, seasons, divisions, teams, players, fixtures, match ledger.
      </p>
    </main>
  );
}
