'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { authFetch } from '../../lib/api';
import {
  emptyMigrationDraft,
  migrationDraftTemplates,
  MigrationAssistantView,
  type MigrationJobDetail,
  type MigrationJobSummary,
} from './migration-assistant-view';

function MigrationAssistantPageContent() {
  const search = useSearchParams();
  const initialDraft = useMemo(() => emptyMigrationDraft(), []);
  const [orgId, setOrgId] = useState(search.get('orgId') ?? '');
  const [jobs, setJobs] = useState<MigrationJobSummary[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedJob, setSelectedJob] = useState<MigrationJobDetail | null>(null);
  const [draftText, setDraftText] = useState(JSON.stringify(initialDraft, null, 2));
  const [draftParseError, setDraftParseError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [readyToImport, setReadyToImport] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState('SCREENSHOT');
  const [file, setFile] = useState<File | null>(null);
  const draftTemplates = useMemo(() => migrationDraftTemplates(), []);

  async function loadJobs(selectJobId?: string) {
    setStatus('Loading migration jobs...');
    setError(null);
    try {
      const res = await authFetch(`/orgs/${orgId}/migration-jobs`);
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? 'Failed to load migration jobs');
      const nextJobs = Array.isArray(body) ? (body as MigrationJobSummary[]) : [];
      setJobs(nextJobs);

      const targetJobId = selectJobId ?? selectedJobId ?? nextJobs[0]?.id ?? '';
      if (targetJobId) {
        await loadJobDetail(targetJobId);
      } else {
        setSelectedJobId('');
        setSelectedJob(null);
        setDraftText(JSON.stringify(emptyMigrationDraft(), null, 2));
        setDraftParseError(null);
        setHasUnsavedChanges(false);
        setReadyToImport(false);
      }
      setStatus('Migration jobs loaded');
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : 'Failed to load migration jobs');
    }
  }

  async function loadJobDetail(jobId: string) {
    setStatus('Loading migration job detail...');
    setError(null);
    try {
      const res = await authFetch(`/orgs/${orgId}/migration-jobs/${jobId}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? 'Failed to load migration job');
      const job = body as MigrationJobDetail;
      setSelectedJobId(jobId);
      setSelectedJob(job);
      setDraftText(JSON.stringify(job.draft ?? emptyMigrationDraft(), null, 2));
      setDraftParseError(null);
      setHasUnsavedChanges(false);
      setReadyToImport(
        (job.status === 'READY_TO_IMPORT' || job.status === 'IMPORTED')
        && job.validationSummary?.valid !== false,
      );
      setStatus('Migration job loaded');
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : 'Failed to load migration job');
    }
  }

  async function createJob() {
    if (!file) {
      setError('Choose a file before creating a migration job');
      return;
    }
    setStatus('Creating migration job...');
    setError(null);

    try {
      const formData = new FormData();
      formData.set('sourceType', sourceType);
      formData.set('file', file);

      const res = await authFetch(`/orgs/${orgId}/migration-jobs`, {
        method: 'POST',
        body: formData,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? 'Failed to create migration job');
      setFile(null);
      await loadJobs(body.id as string);
      setStatus('Migration job created');
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : 'Failed to create migration job');
    }
  }

  async function saveReview() {
    if (!selectedJobId) return;
    setStatus('Saving review...');
    setError(null);

    try {
      const parsed = JSON.parse(draftText) as Record<string, unknown>;
      setDraftParseError(null);
      const res = await authFetch(`/orgs/${orgId}/migration-jobs/${selectedJobId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: parsed, readyToImport }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? 'Failed to save review');
      setHasUnsavedChanges(false);
      await loadJobs(selectedJobId);
      setStatus('Review saved');
    } catch (err) {
      setStatus(null);
      if (err instanceof SyntaxError) {
        setDraftParseError(`Draft JSON is invalid: ${err.message}`);
        setError('Fix the draft JSON before saving review');
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to save review');
    }
  }

  async function importJob() {
    if (!selectedJobId) return;
    if (hasUnsavedChanges) {
      setError('Save review before importing this migration job');
      setStatus(null);
      return;
    }
    setStatus('Importing migration job...');
    setError(null);

    try {
      const res = await authFetch(`/orgs/${orgId}/migration-jobs/${selectedJobId}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error?.message ?? 'Failed to import migration job');
      await loadJobs(selectedJobId);
      setStatus('Migration job imported');
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : 'Failed to import migration job');
    }
  }

  async function openAsset(assetId: string, filename: string) {
    if (!selectedJobId) return;
    setStatus('Opening migration asset...');
    setError(null);

    try {
      const res = await authFetch(`/orgs/${orgId}/migration-jobs/${selectedJobId}/assets/${assetId}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? 'Failed to open migration asset');
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      setStatus('Migration asset opened');
    } catch (err) {
      setStatus(null);
      setError(err instanceof Error ? err.message : 'Failed to open migration asset');
    }
  }

  function applyDraftTemplate(templateId: string) {
    const template = draftTemplates.find(item => item.id === templateId);
    if (!template) {
      setError('Unknown draft template');
      return;
    }

    setError(null);
    setDraftParseError(null);
    setDraftText(JSON.stringify(template.draft, null, 2));
    setHasUnsavedChanges(true);
    setReadyToImport(false);
    setStatus(`Draft template applied: ${template.label}`);
  }

  function updateDraftText(value: string) {
    setDraftText(value);
    setHasUnsavedChanges(true);
    setReadyToImport(false);
    if (draftParseError) {
      setDraftParseError(null);
    }
  }

  function formatDraft() {
    try {
      const parsed = JSON.parse(draftText) as Record<string, unknown>;
      setDraftText(JSON.stringify(parsed, null, 2));
      setDraftParseError(null);
      setHasUnsavedChanges(true);
      setReadyToImport(false);
      setError(null);
      setStatus('Draft JSON formatted');
    } catch (err) {
      setDraftParseError(
        `Draft JSON is invalid: ${err instanceof Error ? err.message : 'Unable to parse draft JSON'}`,
      );
      setError('Fix the draft JSON before formatting');
      setStatus(null);
    }
  }

  return (
    <MigrationAssistantView
      orgId={orgId}
      status={status}
      error={error}
      jobs={jobs}
      selectedJobId={selectedJobId}
      draftText={draftText}
      draftParseError={draftParseError}
      hasUnsavedChanges={hasUnsavedChanges}
      readyToImport={readyToImport}
      selectedJob={selectedJob}
      sourceType={sourceType}
      onOrgIdChange={setOrgId}
      onLoadJobs={() => void loadJobs()}
      onSelectJob={value => void loadJobDetail(value)}
      onDraftTextChange={updateDraftText}
      onApplyDraftTemplate={applyDraftTemplate}
      onFormatDraft={formatDraft}
      onReadyToImportChange={setReadyToImport}
      onCreateJob={() => void createJob()}
      onSaveReview={() => void saveReview()}
      onImportJob={() => void importJob()}
      onOpenAsset={(assetId, filename) => void openAsset(assetId, filename)}
      onSourceTypeChange={setSourceType}
      onFileChange={setFile}
    />
  );
}

export default function MigrationAssistantPage() {
  return (
    <Suspense fallback={<main><p>Loading migration assistant...</p></main>}>
      <MigrationAssistantPageContent />
    </Suspense>
  );
}
