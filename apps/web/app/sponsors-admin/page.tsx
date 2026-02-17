'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { authFetch, getAccessToken } from '../../lib/api';

type Org = { id: string; name: string; role?: string };
type ScopeType = 'ORG' | 'LEAGUE' | 'DIVISION';
type SponsorSlot = {
  id: string;
  scopeType: ScopeType;
  scopeId: string | null;
  title: string | null;
  imageUrl: string;
  linkUrl: string | null;
  startAt: string | null;
  endAt: string | null;
  sortOrder: number;
  createdAt: string;
};

const ORG_ID_STORAGE_KEY = 'selectedOrgId';

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIsoOrUndefined(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function SponsorsAdminPageContent() {
  const search = useSearchParams();
  const initialOrgId = search.get('orgId') ?? '';

  const [orgId, setOrgId] = useState(initialOrgId);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [sponsors, setSponsors] = useState<SponsorSlot[]>([]);
  const [scopeType, setScopeType] = useState<ScopeType>('ORG');
  const [scopeId, setScopeId] = useState('');
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const [loadingSponsors, setLoadingSponsors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const orgLookup = useMemo(
    () =>
      orgs.reduce<Record<string, Org>>((acc, current) => {
        acc[current.id] = current;
        return acc;
      }, {}),
    [orgs],
  );

  useEffect(() => {
    if (!getAccessToken()) {
      window.location.href = '/login';
      return;
    }
    void loadOrgsAndResolveOrg();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!orgId) return;
    window.localStorage.setItem(ORG_ID_STORAGE_KEY, orgId);
    void loadSponsors(orgId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  async function loadOrgsAndResolveOrg() {
    setLoadingOrgs(true);
    setError(null);
    try {
      const response = await authFetch('/orgs');
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message ?? 'Failed to load organisations');

      const nextOrgs = Array.isArray(data) ? (data as Org[]) : [];
      setOrgs(nextOrgs);

      const storedOrgId = window.localStorage.getItem(ORG_ID_STORAGE_KEY) ?? '';
      const resolvedOrgId = initialOrgId || storedOrgId || nextOrgs[0]?.id || '';
      if (!resolvedOrgId) {
        setStatus('No organisations available. Create one first in Organisations.');
        return;
      }
      setOrgId(resolvedOrgId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organisations');
    } finally {
      setLoadingOrgs(false);
    }
  }

  async function loadSponsors(nextOrgId: string) {
    setLoadingSponsors(true);
    setError(null);
    setStatus('Loading sponsors...');
    try {
      const response = await authFetch(`/orgs/${nextOrgId}/sponsors`);
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message ?? 'Failed to load sponsors');
      setSponsors(Array.isArray(data) ? (data as SponsorSlot[]) : []);
      setStatus('Sponsors loaded');
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : 'Failed to load sponsors');
    } finally {
      setLoadingSponsors(false);
    }
  }

  async function createSponsor(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId) return;

    setSaving(true);
    setError(null);
    setStatus('Creating sponsor...');
    try {
      const body: Record<string, unknown> = {
        scopeType,
        imageUrl,
        sortOrder,
      };
      if (scopeType !== 'ORG') body.scopeId = scopeId;
      if (title) body.title = title;
      if (linkUrl) body.linkUrl = linkUrl;
      const nextStartAt = toIsoOrUndefined(startAt);
      const nextEndAt = toIsoOrUndefined(endAt);
      if (nextStartAt) body.startAt = nextStartAt;
      if (nextEndAt) body.endAt = nextEndAt;

      const response = await authFetch(`/orgs/${orgId}/sponsors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message ?? 'Failed to create sponsor');

      setTitle('');
      setImageUrl('');
      setLinkUrl('');
      setStartAt('');
      setEndAt('');
      setSortOrder(0);
      if (scopeType !== 'ORG') setScopeId('');

      await loadSponsors(orgId);
      setStatus('Sponsor created');
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : 'Failed to create sponsor');
    } finally {
      setSaving(false);
    }
  }

  async function deleteSponsor(sponsorId: string) {
    if (!orgId) return;
    setError(null);
    setStatus('Deleting sponsor...');
    try {
      const response = await authFetch(`/orgs/${orgId}/sponsors/${sponsorId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message ?? 'Failed to delete sponsor');
      await loadSponsors(orgId);
      setStatus('Sponsor deleted');
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : 'Failed to delete sponsor');
    }
  }

  return (
    <main>
      <h1>Sponsors Admin</h1>
      <p>Manage organiser-controlled sponsorship slots.</p>
      <p>
        <a href="/orgs">Organisations</a> | <a href="/notifications-admin">Notifications</a> |{' '}
        <a href="/schedule">Schedule</a>
      </p>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <label htmlFor="org-picker">Organisation:</label>
        <select
          id="org-picker"
          value={orgId}
          onChange={e => setOrgId(e.target.value)}
          disabled={loadingOrgs || orgs.length === 0}
        >
          {!orgId && <option value="">Select organisation</option>}
          {orgs.map(org => (
            <option key={org.id} value={org.id}>
              {org.name} {org.role ? `(${org.role})` : ''}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => void loadSponsors(orgId)} disabled={!orgId || loadingSponsors}>
          Refresh sponsors
        </button>
      </div>

      <form onSubmit={createSponsor} style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
        <h2>Create sponsor slot</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={scopeType} onChange={e => setScopeType(e.target.value as ScopeType)}>
            <option value="ORG">ORG</option>
            <option value="LEAGUE">LEAGUE</option>
            <option value="DIVISION">DIVISION</option>
          </select>
          {scopeType !== 'ORG' ? (
            <input
              placeholder={`${scopeType} scopeId (UUID)`}
              value={scopeId}
              onChange={e => setScopeId(e.target.value)}
              required
            />
          ) : null}
          <input placeholder="Title (optional)" value={title} onChange={e => setTitle(e.target.value)} />
          <input
            placeholder="Image URL"
            type="url"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            required
          />
          <input placeholder="Link URL (optional)" type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} />
          <input
            type="datetime-local"
            value={startAt}
            onChange={e => setStartAt(e.target.value)}
            aria-label="Start at"
          />
          <input type="datetime-local" value={endAt} onChange={e => setEndAt(e.target.value)} aria-label="End at" />
          <input
            type="number"
            min={0}
            value={sortOrder}
            onChange={e => setSortOrder(Number(e.target.value))}
            aria-label="Sort order"
          />
          <button type="submit" disabled={!orgId || saving}>
            {saving ? 'Saving...' : 'Create'}
          </button>
        </div>
      </form>

      {status ? <p>{status}</p> : null}
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}

      <h2>Sponsor slots</h2>
      {loadingSponsors ? <p>Loading...</p> : null}
      {!loadingSponsors && sponsors.length === 0 ? <p>No sponsor slots found.</p> : null}
      {sponsors.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Scope</th>
              <th style={{ textAlign: 'left' }}>Title</th>
              <th style={{ textAlign: 'left' }}>Image</th>
              <th style={{ textAlign: 'left' }}>Link</th>
              <th style={{ textAlign: 'left' }}>Window</th>
              <th style={{ textAlign: 'left' }}>Sort</th>
              <th style={{ textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sponsors.map(slot => (
              <tr key={slot.id}>
                <td>
                  {slot.scopeType}
                  {slot.scopeId ? ` (${slot.scopeId})` : ''}
                </td>
                <td>{slot.title ?? '-'}</td>
                <td>
                  <a href={slot.imageUrl} target="_blank" rel="noreferrer">
                    {slot.imageUrl}
                  </a>
                </td>
                <td>{slot.linkUrl ? <a href={slot.linkUrl}>{slot.linkUrl}</a> : '-'}</td>
                <td>
                  {toDatetimeLocal(slot.startAt) || '-'} to {toDatetimeLocal(slot.endAt) || '-'}
                </td>
                <td>{slot.sortOrder}</td>
                <td>
                  <button type="button" onClick={() => void deleteSponsor(slot.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      {orgId && orgLookup[orgId] ? <p>Current organisation: {orgLookup[orgId].name}</p> : null}
    </main>
  );
}

export default function SponsorsAdminPage() {
  return (
    <Suspense fallback={<main><p>Loading sponsors admin...</p></main>}>
      <SponsorsAdminPageContent />
    </Suspense>
  );
}
