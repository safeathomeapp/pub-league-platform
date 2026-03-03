import type { CSSProperties } from 'react';

export type MigrationJobSummary = {
  id: string;
  status: string;
  sourceType: string;
  createdAt: string;
};

export type MigrationValidationIssue = {
  code: string;
  message: string;
  path: string;
};

export type MigrationValidationSummary = {
  valid: boolean;
  errorCount: number;
  warningCount: number;
  errors: MigrationValidationIssue[];
  warnings: MigrationValidationIssue[];
};

export type MigrationImportPreviewSummary = {
  leagueName: string;
  seasonName: string;
  divisionNames: string[];
  teamNames: string[];
  playerDisplayNames: string[];
  fixturePairs: string[];
  counts: {
    divisions: number;
    teams: number;
    players: number;
    fixtures: number;
  };
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

export type MigrationDraftTemplate = {
  id: string;
  label: string;
  description: string;
  draft: MigrationDraft;
};

export type MigrationJobDetail = MigrationJobSummary & {
  draft: MigrationDraft;
  assets: Array<{ id: string; originalFilename: string; mimeType: string }>;
  importAudits: Array<{
    id: string;
    actorUserId: string;
    createdAt: string;
    summaryJson: {
      leagueId?: string;
      seasonId?: string;
      counts?: {
        divisions?: number;
        teams?: number;
        players?: number;
        fixtures?: number;
      };
    } | null;
  }>;
  failureReason?: string | null;
  validationSummary?: MigrationValidationSummary;
  importPreviewSummary?: MigrationImportPreviewSummary;
};

type Props = {
  orgId: string;
  status: string | null;
  error: string | null;
  jobs: MigrationJobSummary[];
  selectedJobId: string;
  draftText: string;
  draftParseError: string | null;
  hasUnsavedChanges: boolean;
  readyToImport: boolean;
  selectedJob: MigrationJobDetail | null;
  sourceType: string;
  onOrgIdChange: (value: string) => void;
  onLoadJobs: () => void;
  onSelectJob: (value: string) => void;
  onDraftTextChange: (value: string) => void;
  onApplyDraftTemplate: (templateId: string) => void;
  onFormatDraft: () => void;
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

export function migrationDraftTemplates(): MigrationDraftTemplate[] {
  return [
    {
      id: 'blank',
      label: 'Blank shell',
      description: 'Reset to an empty draft with the required top-level sections.',
      draft: emptyMigrationDraft(),
    },
    {
      id: 'pool-minimal',
      label: 'Pool minimal',
      description: 'One division, two teams, two players, and one fixture for a thin starting point.',
      draft: {
        league: { name: 'Imported Pool League', sport: 'pool', rulesetId: '' },
        season: {
          name: '2026 Summer Season',
          startDate: '2026-04-01T19:30:00.000Z',
          endDate: '2026-08-31T19:30:00.000Z',
        },
        divisions: [{ tempId: 'div-premier', name: 'Premier' }],
        teams: [
          { tempId: 'team-breakers', divisionTempId: 'div-premier', name: 'Breakers' },
          { tempId: 'team-cue-masters', divisionTempId: 'div-premier', name: 'Cue Masters' },
        ],
        players: [
          { displayName: 'Alice Example', contactEmail: 'alice@example.com', contactPhone: '' },
          { displayName: 'Bob Example', contactEmail: 'bob@example.com', contactPhone: '' },
        ],
        fixtures: [
          {
            divisionTempId: 'div-premier',
            homeTeamTempId: 'team-breakers',
            awayTeamTempId: 'team-cue-masters',
            scheduledAt: '2026-04-10T19:30:00.000Z',
          },
        ],
      },
    },
  ];
}

export function MigrationAssistantView(props: Props) {
  const {
    orgId,
    status,
    error,
    jobs,
    selectedJobId,
    draftText,
    draftParseError,
    hasUnsavedChanges,
    readyToImport,
    selectedJob,
    sourceType,
  } = props;
  const draftTemplates = migrationDraftTemplates();

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
              {selectedJob.validationSummary ? (
                <>
                  <h3>Validation summary</h3>
                  <p>
                    Valid: <strong>{selectedJob.validationSummary.valid ? 'yes' : 'no'}</strong> | Errors:{' '}
                    <strong>{selectedJob.validationSummary.errorCount}</strong> | Warnings:{' '}
                    <strong>{selectedJob.validationSummary.warningCount}</strong>
                  </p>
                  {selectedJob.validationSummary.errors.length > 0 ? (
                    <>
                      <h4>Blocking errors</h4>
                      <ul style={{ paddingLeft: 18 }}>
                        {selectedJob.validationSummary.errors.map(issue => (
                          <li key={`${issue.code}-${issue.path}`}>
                            {issue.message} ({issue.path})
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  {selectedJob.validationSummary.warnings.length > 0 ? (
                    <>
                      <h4>Warnings</h4>
                      <ul style={{ paddingLeft: 18 }}>
                        {selectedJob.validationSummary.warnings.map(issue => (
                          <li key={`${issue.code}-${issue.path}`}>
                            {issue.message} ({issue.path})
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </>
              ) : null}
              {selectedJob.importPreviewSummary ? (
                <>
                  <h3>Import preview</h3>
                  <p>
                    League: <strong>{selectedJob.importPreviewSummary.leagueName || 'Unspecified'}</strong> | Season:{' '}
                    <strong>{selectedJob.importPreviewSummary.seasonName || 'Unspecified'}</strong>
                  </p>
                  <p>
                    Divisions: <strong>{selectedJob.importPreviewSummary.counts.divisions}</strong> | Teams:{' '}
                    <strong>{selectedJob.importPreviewSummary.counts.teams}</strong> | Players:{' '}
                    <strong>{selectedJob.importPreviewSummary.counts.players}</strong> | Fixtures:{' '}
                    <strong>{selectedJob.importPreviewSummary.counts.fixtures}</strong>
                  </p>
                  {selectedJob.importPreviewSummary.divisionNames.length > 0 ? (
                    <p>Divisions: {selectedJob.importPreviewSummary.divisionNames.join(', ')}</p>
                  ) : null}
                  {selectedJob.importPreviewSummary.teamNames.length > 0 ? (
                    <p>Teams: {selectedJob.importPreviewSummary.teamNames.join(', ')}</p>
                  ) : null}
                  {selectedJob.importPreviewSummary.playerDisplayNames.length > 0 ? (
                    <p>Players: {selectedJob.importPreviewSummary.playerDisplayNames.join(', ')}</p>
                  ) : null}
                  {selectedJob.importPreviewSummary.fixturePairs.length > 0 ? (
                    <p>Fixtures: {selectedJob.importPreviewSummary.fixturePairs.join('; ')}</p>
                  ) : null}
                </>
              ) : null}

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

              <h3>Import audits</h3>
              {selectedJob.importAudits.length === 0 ? <p>No import audits recorded.</p> : null}
              {selectedJob.importAudits.length > 0 ? (
                <ul style={{ paddingLeft: 18 }}>
                  {selectedJob.importAudits.map(audit => (
                    <li key={audit.id}>
                      {audit.createdAt}: actor {audit.actorUserId} imported divisions{' '}
                      {audit.summaryJson?.counts?.divisions ?? 0}, teams {audit.summaryJson?.counts?.teams ?? 0},
                      players {audit.summaryJson?.counts?.players ?? 0}, fixtures{' '}
                      {audit.summaryJson?.counts?.fixtures ?? 0}
                    </li>
                  ))}
                </ul>
              ) : null}

              <label htmlFor="draftText">Draft JSON</label>
              <div style={rowStyle}>
                {draftTemplates.map(template => (
                  <button key={template.id} type="button" onClick={() => props.onApplyDraftTemplate(template.id)}>
                    Use template: {template.label}
                  </button>
                ))}
              </div>
              <p style={{ marginTop: 8 }}>
                {draftTemplates.map(template => `${template.label}: ${template.description}`).join(' | ')}
              </p>
              <div style={rowStyle}>
                <button type="button" onClick={props.onFormatDraft}>
                  Format draft JSON
                </button>
              </div>
              {draftParseError ? <p style={{ color: 'crimson' }}>{draftParseError}</p> : null}
              {hasUnsavedChanges ? (
                <p style={{ color: '#b45309' }}>
                  You have unsaved draft changes. Save review before switching jobs or importing.
                </p>
              ) : null}
              {hasUnsavedChanges ? (
                <p style={{ color: '#1d4ed8' }}>
                  Ready to import is cleared on local edits. Re-check it after saving the reviewed draft.
                </p>
              ) : null}
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
                <button
                  type="button"
                  onClick={props.onImportJob}
                  disabled={
                    !selectedJobId
                    || !readyToImport
                    || hasUnsavedChanges
                    || selectedJob.validationSummary?.valid === false
                  }
                >
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
