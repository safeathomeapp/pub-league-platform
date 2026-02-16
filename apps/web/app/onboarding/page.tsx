'use client';

import { useMemo, useState } from 'react';

const demoCredentials = {
  email: 'demo.organiser@publeague.local',
  password: 'demo12345',
};

export default function OnboardingPage() {
  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1',
    [],
  );
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loginDemo() {
    setStatus('Signing in demo organiser...');
    setError(null);
    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demoCredentials),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? 'Demo login failed');

      localStorage.setItem('accessToken', data.accessToken);
      setStatus('Signed in. Redirecting to organisations...');
      window.location.href = '/orgs';
    } catch (err) {
      setStatus(null);
      setError(
        `${err instanceof Error ? err.message : 'Demo login failed'}. Run \`npm run seed:demo\` first.`,
      );
    }
  }

  return (
    <main>
      <h1>Demo Onboarding</h1>
      <p>Use this to bootstrap and walk through the seeded demo flow.</p>

      <ol>
        <li>Run <code>npm run seed:demo</code> from repo root.</li>
        <li>Click <strong>Sign in Demo Organiser</strong>.</li>
        <li>Open <a href="/schedule">Schedule</a> and load seeded fixtures.</li>
        <li>Enter a match result and view updated standings.</li>
      </ol>

      <p>
        Demo account: <code>{demoCredentials.email}</code> / <code>{demoCredentials.password}</code>
      </p>

      <button type="button" onClick={() => void loginDemo()}>
        Sign in Demo Organiser
      </button>

      {status ? <p>{status}</p> : null}
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
    </main>
  );
}
