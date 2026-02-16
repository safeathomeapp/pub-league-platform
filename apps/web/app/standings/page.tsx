'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type PointsModel = {
  win: number;
  draw: number;
  loss: number;
};

type StandingsRow = {
  teamId: string;
  teamName: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesDrawn: number;
  matchesLost: number;
  framesWon: number;
  framesLost: number;
  framesDifference: number;
  matchPoints: number;
};

type StandingsResponse = {
  snapshotId: string;
  divisionId: string;
  generatedAt: string;
  pointsModel: PointsModel;
  rows: StandingsRow[];
};

export default function StandingsPage() {
  const search = useSearchParams();
  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1',
    [],
  );
  const [orgId, setOrgId] = useState(search.get('orgId') ?? '');
  const [divisionId, setDivisionId] = useState(search.get('divisionId') ?? '');
  const [data, setData] = useState<StandingsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function authFetch(path: string) {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      window.location.href = '/login';
      throw new Error('Not authenticated');
    }

    return fetch(`${apiBase}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async function loadStandings(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authFetch(`/orgs/${orgId}/divisions/${divisionId}/standings`);
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? 'Failed to load standings');
      setData(body as StandingsResponse);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : 'Failed to load standings');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Standings</h1>
      <p>Load current table rows for a division after match completion events.</p>
      <p>
        <a href="/schedule">Schedule</a> | <a href={`/match-night?orgId=${orgId}&divisionId=${divisionId}`}>Match Night</a>
      </p>

      <form onSubmit={loadStandings} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <input placeholder="orgId" value={orgId} onChange={e => setOrgId(e.target.value)} required />
        <input placeholder="divisionId" value={divisionId} onChange={e => setDivisionId(e.target.value)} required />
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Load standings'}
        </button>
      </form>

      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}

      {data ? (
        <>
          <p>
            Snapshot: <code>{data.snapshotId}</code>
          </p>
          <p>
            Points model: win {data.pointsModel.win} / draw {data.pointsModel.draw} / loss {data.pointsModel.loss}
          </p>
          <p>Generated at: {data.generatedAt}</p>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Team</th>
                <th style={{ textAlign: 'left' }}>P</th>
                <th style={{ textAlign: 'left' }}>W</th>
                <th style={{ textAlign: 'left' }}>D</th>
                <th style={{ textAlign: 'left' }}>L</th>
                <th style={{ textAlign: 'left' }}>FW</th>
                <th style={{ textAlign: 'left' }}>FL</th>
                <th style={{ textAlign: 'left' }}>FD</th>
                <th style={{ textAlign: 'left' }}>Pts</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map(row => (
                <tr key={row.teamId}>
                  <td>{row.teamName}</td>
                  <td>{row.matchesPlayed}</td>
                  <td>{row.matchesWon}</td>
                  <td>{row.matchesDrawn}</td>
                  <td>{row.matchesLost}</td>
                  <td>{row.framesWon}</td>
                  <td>{row.framesLost}</td>
                  <td>{row.framesDifference}</td>
                  <td>{row.matchPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
    </main>
  );
}
