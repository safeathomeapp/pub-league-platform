'use client';

import { Suspense, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
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
    <main
      style={{
        minHeight: '100vh',
        padding: 18,
        color: '#f3f4f6',
        background: 'radial-gradient(circle at 20% 20%, #1f2937, #0b1220 58%, #050812 100%)',
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 34, letterSpacing: 1 }}>TV OVERLAY</h1>
          <p style={{ margin: '4px 0 0 0', color: '#cbd5e1' }}>Read-only venue display. Refresh every 15 seconds.</p>
        </div>
        <p style={{ margin: 0, color: stale ? '#fca5a5' : '#86efac', fontWeight: 600 }}>
          {status}
          {stale ? ' (showing last good data)' : ''}
        </p>
      </header>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14, marginBottom: 14 }}>
        <input placeholder="orgId" value={orgId} onChange={e => setOrgId(e.target.value)} style={inputStyle} />
        <input placeholder="divisionId" value={divisionId} onChange={e => setDivisionId(e.target.value)} style={inputStyle} />
        <input placeholder="teamId (optional)" value={teamId} onChange={e => setTeamId(e.target.value)} style={inputStyle} />
      </div>

      {!data ? (
        <p style={{ color: '#e2e8f0' }}>No overlay data loaded yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: '2fr 1.2fr' }}>
          <section style={panelStyle}>
            <h2 style={sectionTitle}>Live Fixtures</h2>
            {data.fixtures.live.length === 0 ? <p style={emptyStyle}>No live fixtures</p> : null}
            {data.fixtures.live.map(item => (
              <div key={item.fixtureId} style={fixtureLiveCardStyle}>
                <div style={{ fontSize: 22, fontWeight: 700 }}>
                  {item.homeTeam.name} <span style={{ color: '#93c5fd' }}>vs</span> {item.awayTeam.name}
                </div>
                <div style={{ fontSize: 13, color: '#bfdbfe' }}>{item.state}</div>
              </div>
            ))}
          </section>

          <section style={panelStyle}>
            <h2 style={sectionTitle}>Standings Top 5</h2>
            {data.standings.rows.slice(0, 5).map((row, idx) => (
              <div key={row.teamName} style={standingsRowStyle}>
                <span style={{ fontWeight: 700 }}>{idx + 1}. {row.teamName}</span>
                <span>{row.matchPoints} pts</span>
                <span style={{ color: row.framesDifference >= 0 ? '#86efac' : '#fca5a5' }}>
                  {row.framesDifference >= 0 ? '+' : ''}{row.framesDifference}
                </span>
              </div>
            ))}
          </section>

          <section style={{ ...panelStyle, gridColumn: '1 / span 2' }}>
            <h2 style={sectionTitle}>Next Fixtures</h2>
            {data.fixtures.next.length === 0 ? <p style={emptyStyle}>No upcoming fixtures</p> : null}
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
              {data.fixtures.next.map(item => (
                <div key={item.fixtureId} style={fixtureNextCardStyle}>
                  <div style={{ fontWeight: 700 }}>{item.homeTeam.name} vs {item.awayTeam.name}</div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>{item.scheduledAt ?? 'TBD'}</div>
                </div>
              ))}
            </div>
          </section>

          <section style={{ ...panelStyle, gridColumn: '1 / span 2' }}>
            <h2 style={sectionTitle}>Sponsors</h2>
            {data.sponsors.length === 0 ? <p style={emptyStyle}>No sponsors configured</p> : null}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {data.sponsors.map(s => (
                <a
                  key={s.id}
                  href={s.linkUrl ?? '#'}
                  target={s.linkUrl ? '_blank' : undefined}
                  rel={s.linkUrl ? 'noreferrer noopener' : undefined}
                  style={{ textDecoration: 'none', color: '#e5e7eb' }}
                >
                  <div style={sponsorCardStyle}>
                    <img src={s.imageUrl} alt={s.title ?? 'Sponsor'} style={{ width: '100%', height: 70, objectFit: 'cover', borderRadius: 6 }} />
                    <div style={{ marginTop: 6, fontSize: 13 }}>{s.title ?? 'Sponsor'}</div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        </div>
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

const panelStyle: CSSProperties = {
  background: 'rgba(15, 23, 42, 0.75)',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  borderRadius: 12,
  padding: 14,
};

const sectionTitle: CSSProperties = {
  marginTop: 0,
  marginBottom: 10,
  fontSize: 20,
  letterSpacing: 0.4,
};

const inputStyle: CSSProperties = {
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid #334155',
  background: '#0f172a',
  color: '#f1f5f9',
  minWidth: 220,
};

const fixtureLiveCardStyle: CSSProperties = {
  padding: 10,
  borderRadius: 10,
  background: 'linear-gradient(90deg, rgba(30,64,175,0.45), rgba(30,58,138,0.2))',
  marginBottom: 8,
};

const fixtureNextCardStyle: CSSProperties = {
  border: '1px solid rgba(148,163,184,0.2)',
  borderRadius: 10,
  padding: 10,
  background: 'rgba(15,23,42,0.5)',
};

const sponsorCardStyle: CSSProperties = {
  width: 170,
  border: '1px solid rgba(148,163,184,0.25)',
  borderRadius: 8,
  padding: 8,
  background: 'rgba(15,23,42,0.5)',
};

const standingsRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr auto auto',
  gap: 10,
  padding: '6px 0',
  borderBottom: '1px solid rgba(148,163,184,0.16)',
};

const emptyStyle: CSSProperties = {
  color: '#94a3b8',
};
