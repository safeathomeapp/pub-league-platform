import { renderToStaticMarkup } from 'react-dom/server';
import { MigrationAssistantView, emptyMigrationDraft } from '../app/migration-assistant/migration-assistant-view';

describe('migration assistant smoke', () => {
  it('renders the core upload, review, and import flow', () => {
    const html = renderToStaticMarkup(
      <MigrationAssistantView
        orgId="org-123"
        status="Loaded"
        error={null}
        jobs={[{ id: 'job-1', status: 'READY_TO_IMPORT', sourceType: 'SCREENSHOT', createdAt: '2026-03-02T00:00:00.000Z' }]}
        selectedJobId="job-1"
        draftText={JSON.stringify(emptyMigrationDraft(), null, 2)}
        draftParseError={null}
        hasUnsavedChanges={false}
        readyToImport
        selectedJob={{
          id: 'job-1',
          status: 'READY_TO_IMPORT',
          sourceType: 'SCREENSHOT',
          createdAt: '2026-03-02T00:00:00.000Z',
          draft: emptyMigrationDraft(),
          assets: [{ id: 'asset-1', originalFilename: 'scoreboard.png', mimeType: 'image/png' }],
          importAudits: [],
          validationSummary: {
            valid: false,
            errorCount: 1,
            warningCount: 1,
            errors: [{ code: 'LEAGUE_NAME_REQUIRED', message: 'League name is required', path: 'draft.league.name' }],
            warnings: [{ code: 'PLAYER_EMAIL_MISSING', message: 'Player contactEmail is missing', path: 'draft.players[0].contactEmail' }],
          },
          importPreviewSummary: {
            leagueName: 'Imported League',
            seasonName: 'Imported Season',
            divisionNames: ['Premier'],
            teamNames: ['Breakers', 'Cue Masters'],
            playerDisplayNames: ['Alice Example'],
            fixturePairs: ['Breakers vs Cue Masters'],
            counts: { divisions: 1, teams: 2, players: 1, fixtures: 1 },
          },
        }}
        onOrgIdChange={() => {}}
        onLoadJobs={() => {}}
        onSelectJob={() => {}}
        onDraftTextChange={() => {}}
        onApplyDraftTemplate={() => {}}
        onFormatDraft={() => {}}
        onReadyToImportChange={() => {}}
        onCreateJob={() => {}}
        onSaveReview={() => {}}
        onImportJob={() => {}}
        onOpenAsset={() => {}}
        onSourceTypeChange={() => {}}
        sourceType="SCREENSHOT"
        onFileChange={() => {}}
      />,
    );

    expect(html).toContain('Migration Assistant');
    expect(html).toContain('Create migration job');
    expect(html).toContain('Draft JSON');
    expect(html).toContain('Use template: Blank shell');
    expect(html).toContain('Use template: Pool minimal');
    expect(html).toContain('Format draft JSON');
    expect(html).toContain('Import selected job');
    expect(html).toContain('scoreboard.png');
    expect(html).toContain('Open');
    expect(html).toContain('No import audits recorded.');
    expect(html).toContain('Validation summary');
    expect(html).toContain('League name is required');
    expect(html).toContain('Player contactEmail is missing');
    expect(html).toContain('Import preview');
    expect(html).toContain('Imported League');
    expect(html).toContain('Alice Example');
    expect(html).toContain('Breakers vs Cue Masters');
  });

  it('renders empty state when no job is selected', () => {
    const html = renderToStaticMarkup(
      <MigrationAssistantView
        orgId="org-123"
        status={null}
        error={null}
        jobs={[]}
        selectedJobId=""
        draftText={JSON.stringify(emptyMigrationDraft(), null, 2)}
        draftParseError={null}
        hasUnsavedChanges={false}
        readyToImport={false}
        selectedJob={null}
        onOrgIdChange={() => {}}
        onLoadJobs={() => {}}
        onSelectJob={() => {}}
        onDraftTextChange={() => {}}
        onApplyDraftTemplate={() => {}}
        onFormatDraft={() => {}}
        onReadyToImportChange={() => {}}
        onCreateJob={() => {}}
        onSaveReview={() => {}}
        onImportJob={() => {}}
        onOpenAsset={() => {}}
        onSourceTypeChange={() => {}}
        sourceType="SCREENSHOT"
        onFileChange={() => {}}
      />,
    );

    expect(html).toContain('No migration jobs loaded.');
    expect(html).toContain('Select a migration job.');
  });

  it('renders import audit history for an imported job', () => {
    const html = renderToStaticMarkup(
      <MigrationAssistantView
        orgId="org-123"
        status="Loaded"
        error={null}
        jobs={[{ id: 'job-1', status: 'IMPORTED', sourceType: 'SCREENSHOT', createdAt: '2026-03-02T00:00:00.000Z' }]}
        selectedJobId="job-1"
        draftText={JSON.stringify(emptyMigrationDraft(), null, 2)}
        draftParseError={null}
        hasUnsavedChanges={false}
        readyToImport
        selectedJob={{
          id: 'job-1',
          status: 'IMPORTED',
          sourceType: 'SCREENSHOT',
          createdAt: '2026-03-02T00:00:00.000Z',
          draft: emptyMigrationDraft(),
          assets: [],
          importAudits: [
            {
              id: 'audit-1',
              actorUserId: 'user-123',
              createdAt: '2026-03-03T15:40:00.000Z',
              summaryJson: {
                counts: { divisions: 1, teams: 2, players: 4, fixtures: 6 },
              },
            },
          ],
          validationSummary: {
            valid: true,
            errorCount: 0,
            warningCount: 0,
            errors: [],
            warnings: [],
          },
          importPreviewSummary: {
            leagueName: 'Imported League',
            seasonName: 'Imported Season',
            divisionNames: ['Premier'],
            teamNames: ['Breakers', 'Cue Masters'],
            playerDisplayNames: ['Alice Example'],
            fixturePairs: ['Breakers vs Cue Masters'],
            counts: { divisions: 1, teams: 2, players: 1, fixtures: 1 },
          },
        }}
        onOrgIdChange={() => {}}
        onLoadJobs={() => {}}
        onSelectJob={() => {}}
        onDraftTextChange={() => {}}
        onApplyDraftTemplate={() => {}}
        onFormatDraft={() => {}}
        onReadyToImportChange={() => {}}
        onCreateJob={() => {}}
        onSaveReview={() => {}}
        onImportJob={() => {}}
        onOpenAsset={() => {}}
        onSourceTypeChange={() => {}}
        sourceType="SCREENSHOT"
        onFileChange={() => {}}
      />,
    );

    expect(html).toContain('Import audits');
    expect(html).toContain('user-123');
    expect(html).toContain('teams 2');
    expect(html).toContain('fixtures 6');
  });

  it('renders local draft parse errors near the editor', () => {
    const html = renderToStaticMarkup(
      <MigrationAssistantView
        orgId="org-123"
        status={null}
        error="Fix the draft JSON before saving review"
        jobs={[{ id: 'job-1', status: 'REVIEW_REQUIRED', sourceType: 'SCREENSHOT', createdAt: '2026-03-02T00:00:00.000Z' }]}
        selectedJobId="job-1"
        draftText="{"
        draftParseError="Draft JSON is invalid: Unexpected end of JSON input"
        hasUnsavedChanges
        readyToImport={false}
        selectedJob={{
          id: 'job-1',
          status: 'REVIEW_REQUIRED',
          sourceType: 'SCREENSHOT',
          createdAt: '2026-03-02T00:00:00.000Z',
          draft: emptyMigrationDraft(),
          assets: [],
          importAudits: [],
          validationSummary: {
            valid: false,
            errorCount: 0,
            warningCount: 0,
            errors: [],
            warnings: [],
          },
          importPreviewSummary: {
            leagueName: '',
            seasonName: '',
            divisionNames: [],
            teamNames: [],
            playerDisplayNames: [],
            fixturePairs: [],
            counts: { divisions: 0, teams: 0, players: 0, fixtures: 0 },
          },
        }}
        onOrgIdChange={() => {}}
        onLoadJobs={() => {}}
        onSelectJob={() => {}}
        onDraftTextChange={() => {}}
        onApplyDraftTemplate={() => {}}
        onFormatDraft={() => {}}
        onReadyToImportChange={() => {}}
        onCreateJob={() => {}}
        onSaveReview={() => {}}
        onImportJob={() => {}}
        onOpenAsset={() => {}}
        onSourceTypeChange={() => {}}
        sourceType="SCREENSHOT"
        onFileChange={() => {}}
      />,
    );

    expect(html).toContain('Draft JSON is invalid: Unexpected end of JSON input');
    expect(html).toContain('Fix the draft JSON before saving review');
    expect(html).toContain('You have unsaved draft changes. Save review before switching jobs or importing.');
    expect(html).toContain('Ready to import is cleared on local edits. Re-check it after saving the reviewed draft.');
  });
});
