'use client';

import { useEffect, useMemo, useState } from 'react';

type Org = { id: string; name: string; role?: string };

export default function OrgsPage() {
  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1',
    [],
  );
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void loadOrgs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadOrgs() {
    setError(null);
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        window.location.href = '/login';
        return;
      }
      const res = await fetch(`${apiBase}/orgs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to load organisations');
      setOrgs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organisations');
    } finally {
      setLoading(false);
    }
  }

  async function createOrg(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        window.location.href = '/login';
        return;
      }
      const res = await fetch(`${apiBase}/orgs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? 'Failed to create organisation');
      setName('');
      setOrgs(current => [data, ...current]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organisation');
    }
  }

  function signOut() {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  }

  return (
    <main>
      <h1>Organisations</h1>
      <p>Pick an organisation to open fixtures and calendar feeds.</p>

      <form onSubmit={createOrg} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          placeholder="New organisation name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          minLength={2}
        />
        <button type="submit">Create</button>
        <button type="button" onClick={loadOrgs} disabled={loading}>
          Refresh
        </button>
        <button type="button" onClick={signOut}>
          Sign out
        </button>
      </form>

      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
      {loading ? <p>Loading...</p> : null}

      <ul>
        {orgs.map(org => (
          <li key={org.id} style={{ marginBottom: 8 }}>
            <strong>{org.name}</strong> {org.role ? <span>({org.role})</span> : null}{' '}
            <a href={`/schedule?orgId=${org.id}`}>Schedule</a> |{' '}
            <a href={`/match-night?orgId=${org.id}`}>Match Night</a> |{' '}
            <a href={`/disputes?orgId=${org.id}`}>Disputes</a> |{' '}
            <a href={`/notifications-admin?orgId=${org.id}`}>Notifications</a> |{' '}
            <a href={`/sponsors-admin?orgId=${org.id}`}>Sponsors</a>
          </li>
        ))}
      </ul>
    </main>
  );
}
