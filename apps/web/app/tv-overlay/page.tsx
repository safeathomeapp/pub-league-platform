'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { authFetch } from '../../lib/api';

type OverlayFixture = {
  fixtureId: string;
  scheduledAt: string | null;
  state: string;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
};

type OverlayPayload = {
  generatedAt: string;
  division: { id: string; name: string };
  fixtures: { live: OverlayFixture[]; next: OverlayFixture[] };
  standings: { asOf: string; rows: Array<{ teamName: string; matchPoints: number; framesDifference: number }> };
  sponsors: Array<{ id: string; title: string | null; imageUrl: string; linkUrl: string | null }>;
};

function TvOverlayPageContent() {
  const search = useSearchParams();
  const [orgId, setOrgId] = useState(search.get('orgId') ?? '');
  const [divisionId, setDivisionId] = useState(search.get('divisionId') ?? '');
  const [teamId, setTeamId] = useState(search.get('teamId') ?? '');
  const [data, setData] = useState<OverlayPayload | null>(null);
  const [status, setStatus] = useState('Idle');
  const [stale, setStale] = useState(false);
  const timerRef = useRef<number | null>(null);
  const query = useMemo(() => {
    if (!orgId || !divisionId) return '';
    const params = new URLSearchParams({ divisionId });
    if (teamId) params.set('teamId', teamId);
    return `/orgs/${orgId}/tv/overlay?${params.toString()}`;
  }, [orgId, divisionId, teamId]);

  useEffect(() => {
    if (!query) return;

    const run = async () => {
      try {
        const res = await authFetch(query);
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error?.message ?? 'Failed to load overlay');
        setData(body);
        setStatus(`Updated ${new Date().toLocaleTimeString()}`);
        setStale(false);
      } catch (err) {
        setStatus(err instanceof Error ? err.message : 'Overlay fetch failed');
        setStale(true);
      }
    };

    void run();
    timerRef.current = window.setInterval(() => {
      void run();
    }, 15000);

    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, [query]);

  return (
    <main style={{ padding: 20 }}>
      <h1>TV Overlay</h1>
      <p>Read-only overlay for venue screens. Polling every 15 seconds.</p>
      <p style={{ color: stale ? 'crimson' : 'inherit' }}>{status}{stale ? ' (showing last good data)' : ''}</p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <input placeholder="orgId" value={orgId} onChange={e => setOrgId(e.target.value)} />
        <input placeholder="divisionId" value={divisionId} onChange={e => setDivisionId(e.target.value)} />
        <input placeholder="teamId (optional)" value={teamId} onChange={e => setTeamId(e.target.value)} />
      </div>

      {!data ? (
        <p>No overlay data loaded yet.</p>
      ) : (
        <>
          <h2>{data.division.name}</h2>

          <section>
            <h3>Live Fixtures</h3>
            {data.fixtures.live.length === 0 ? <p>None</p> : null}
            <ul>
              {data.fixtures.live.map(item => (
                <li key={item.fixtureId}>
                  {item.homeTeam.name} vs {item.awayTeam.name} ({item.state})
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3>Next Fixtures</h3>
            {data.fixtures.next.length === 0 ? <p>None</p> : null}
            <ul>
              {data.fixtures.next.map(item => (
                <li key={item.fixtureId}>
                  {item.scheduledAt ?? 'TBD'} - {item.homeTeam.name} vs {item.awayTeam.name}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3>Standings (Top 5)</h3>
            <ol>
              {data.standings.rows.slice(0, 5).map(row => (
                <li key={row.teamName}>
                  {row.teamName} - {row.matchPoints} pts ({row.framesDifference})
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h3>Sponsors</h3>
            {data.sponsors.length === 0 ? <p>None</p> : null}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {data.sponsors.map(s => (
                <a
                  key={s.id}
                  href={s.linkUrl ?? '#'}
                  target={s.linkUrl ? '_blank' : undefined}
                  rel={s.linkUrl ? 'noreferrer noopener' : undefined}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={{ width: 140 }}>
                    <img src={s.imageUrl} alt={s.title ?? 'Sponsor'} style={{ width: '100%', height: 60, objectFit: 'cover' }} />
                    <div>{s.title ?? 'Sponsor'}</div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

export default function TvOverlayPage() {
  return (
    <Suspense fallback={<main><p>Loading overlay...</p></main>}>
      <TvOverlayPageContent />
    </Suspense>
  );
}
