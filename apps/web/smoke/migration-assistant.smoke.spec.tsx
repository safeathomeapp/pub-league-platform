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
        readyToImport
        selectedJob={{
          id: 'job-1',
          status: 'READY_TO_IMPORT',
          sourceType: 'SCREENSHOT',
          createdAt: '2026-03-02T00:00:00.000Z',
          draft: emptyMigrationDraft(),
          assets: [{ id: 'asset-1', originalFilename: 'scoreboard.png', mimeType: 'image/png' }],
        }}
        onOrgIdChange={() => {}}
        onLoadJobs={() => {}}
        onSelectJob={() => {}}
        onDraftTextChange={() => {}}
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
    expect(html).toContain('Import selected job');
    expect(html).toContain('scoreboard.png');
    expect(html).toContain('Open');
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
        readyToImport={false}
        selectedJob={null}
        onOrgIdChange={() => {}}
        onLoadJobs={() => {}}
        onSelectJob={() => {}}
        onDraftTextChange={() => {}}
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
});
