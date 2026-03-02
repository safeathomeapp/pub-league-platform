import type { CSSProperties } from 'react';

export type MigrationJobSummary = {
  id: string;
  status: string;
  sourceType: string;
  createdAt: string;
};

export type MigrationDraft = {
  league: { name: string; sport: string; rulesetId: string };
  season: { name: string; startDate: string; endDate: string };
  divisions: Array<{ tempId: string; name: string }>;
  teams: Array<{ tempId: string; divisionTempId: string; name: string }>;
  players: Array<{ displayName: string; contactEmail: string; contactPhone: string }>;
  fixtures: Array<{
    divisionTempId: string;
    homeTeamTempId: string;
    awayTeamTempId: string;
    scheduledAt: string | null;
  }>;
};

export type MigrationJobDetail = MigrationJobSummary & {
  draft: MigrationDraft;
  assets: Array<{ id: string; originalFilename: string; mimeType: string }>;
  failureReason?: string | null;
};

type Props = {
  orgId: string;
  status: string | null;
  error: string | null;
  jobs: MigrationJobSummary[];
  selectedJobId: string;
  draftText: string;
  readyToImport: boolean;
  selectedJob: MigrationJobDetail | null;
  sourceType: string;
  onOrgIdChange: (value: string) => void;
  onLoadJobs: () => void;
  onSelectJob: (value: string) => void;
  onDraftTextChange: (value: string) => void;
  onReadyToImportChange: (value: boolean) => void;
  onCreateJob: () => void;
  onSaveReview: () => void;
  onImportJob: () => void;
  onOpenAsset: (assetId: string, filename: string) => void;
  onSourceTypeChange: (value: string) => void;
  onFileChange: (file: File | null) => void;
};

export function emptyMigrationDraft(): MigrationDraft {
  return {
    league: { name: '', sport: 'pool', rulesetId: '' },
    season: { name: '', startDate: '', endDate: '' },
    divisions: [],
    teams: [],
    players: [],
    fixtures: [],
  };
}

export function MigrationAssistantView(props: Props) {
  const {
    orgId,
    status,
    error,
    jobs,
    selectedJobId,
    draftText,
    readyToImport,
    selectedJob,
    sourceType,
  } = props;

  return (
    <main style={{ padding: 20 }}>
      <h1>Migration Assistant</h1>
      <p>Upload legacy league sources, review draft data, and import only after explicit confirmation.</p>
      <p>
        <a href="/orgs">Organisations</a> | <a href="/sponsors-admin">Sponsors</a> | <a href="/tv-overlay">TV Overlay</a>
      </p>

      <section style={panelStyle}>
        <h2>Org Context</h2>
        <div style={rowStyle}>
          <input value={orgId} onChange={e => props.onOrgIdChange(e.target.value)} placeholder="orgId" />
          <button type="button" onClick={props.onLoadJobs} disabled={!orgId}>
            Load jobs
          </button>
        </div>
        {status ? <p>{status}</p> : null}
        {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
      </section>

      <section style={panelStyle}>
        <h2>Create migration job</h2>
        <div style={rowStyle}>
          <select value={sourceType} onChange={e => props.onSourceTypeChange(e.target.value)}>
            <option value="SCREENSHOT">SCREENSHOT</option>
            <option value="CSV">CSV</option>
            <option value="OTHER">OTHER</option>
          </select>
          <input type="file" onChange={e => props.onFileChange(e.target.files?.[0] ?? null)} />
          <button type="button" onClick={props.onCreateJob} disabled={!orgId}>
            Create migration job
          </button>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
        <section style={panelStyle}>
          <h2>Jobs</h2>
          {jobs.length === 0 ? <p>No migration jobs loaded.</p> : null}
          <ul style={{ paddingLeft: 18 }}>
            {jobs.map(job => (
              <li key={job.id}>
                <button
                  type="button"
                  onClick={() => props.onSelectJob(job.id)}
                  style={{
                    background: job.id === selectedJobId ? '#dbeafe' : '#f8fafc',
                    border: '1px solid #cbd5e1',
                    padding: '6px 8px',
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  <strong>{job.status}</strong> · {job.sourceType}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section style={panelStyle}>
          <h2>Review</h2>
          {!selectedJob ? <p>Select a migration job.</p> : null}
          {selectedJob ? (
            <>
              <p>
                Selected job: <strong>{selectedJob.id}</strong>
              </p>
              <p>Status: <strong>{selectedJob.status}</strong></p>
              {selectedJob.failureReason ? <p style={{ color: 'crimson' }}>Failure: {selectedJob.failureReason}</p> : null}

              <h3>Assets</h3>
              <ul style={{ paddingLeft: 18 }}>
                {selectedJob.assets.map(asset => (
                  <li key={asset.id}>
                    {asset.originalFilename} ({asset.mimeType}){' '}
                    <button type="button" onClick={() => props.onOpenAsset(asset.id, asset.originalFilename)}>
                      Open
                    </button>
                  </li>
                ))}
              </ul>

              <label htmlFor="draftText">Draft JSON</label>
              <textarea
                id="draftText"
                value={draftText}
                onChange={e => props.onDraftTextChange(e.target.value)}
                rows={22}
                style={{ width: '100%', fontFamily: 'Consolas, monospace' }}
              />

              <div style={rowStyle}>
                <label>
                  <input
                    type="checkbox"
                    checked={readyToImport}
                    onChange={e => props.onReadyToImportChange(e.target.checked)}
                  />{' '}
                  Ready to import
                </label>
                <button type="button" onClick={props.onSaveReview} disabled={!selectedJobId}>
                  Save review
                </button>
                <button type="button" onClick={props.onImportJob} disabled={!selectedJobId || !readyToImport}>
                  Import selected job
                </button>
              </div>
            </>
          ) : null}
        </section>
      </div>
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
