'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { CsvExportButton } from './csv-export-button';
import { FileUploadInput } from './UI';

type Job = {
  id: string;
  projectId: string;
  projectName: string;
  taskTypeId: string | null;
  taskTypeName: string | null;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
};

type JobDetailModalProps = {
  job: Job | null;
  onClose: () => void;
  onStartTimer: (jobId: string) => void;
  onJobUpdated?: (job: Job) => void;
};

export function JobDetailModal({ job, onClose, onStartTimer, onJobUpdated }: JobDetailModalProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [trackedMinutes, setTrackedMinutes] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [timeEntries, setTimeEntries] = useState<Array<{
    id: string;
    startedAt: string;
    endedAt: string | null;
    durationMinutes: number | null;
    note: string | null;
  }>>([]);
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesMessage, setNotesMessage] = useState('');
  const [loadedNotesJobId, setLoadedNotesJobId] = useState<string | null>(null);
  const router = useRouter();
  const currentJob = job;

  useEffect(() => {
    async function fetchJobStats() {
      if (!currentJob) {
        setSessionCount(0);
        setTrackedMinutes(0);
        setTimeEntries([]);
        return;
      }

      const response = await fetch(`/api/time-entries?jobId=${currentJob.id}`);
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as {
        entries: Array<{
          id: string;
          startedAt: string;
          endedAt: string | null;
          durationMinutes: number | null;
          note: string | null;
        }>;
      };
      setTimeEntries(data.entries);
      setSessionCount(data.entries.length);
      setTrackedMinutes(data.entries.reduce((sum, entry) => sum + (entry.durationMinutes ?? 0), 0));
    }

    void Promise.resolve().then(fetchJobStats);
  }, [currentJob]);

  useEffect(() => {
    if (!currentJob || loadedNotesJobId === currentJob.id) {
      return;
    }

    queueMicrotask(() => {
      setLoadedNotesJobId(currentJob.id);
      setNotes(currentJob.description ?? '');
      setNotesMessage('');
    });
  }, [currentJob, loadedNotesJobId]);

  if (!currentJob) {
    return null;
  }

  async function handleStartTimer() {
    if (!currentJob) {
      return;
    }

    const activeJob = currentJob;
    setIsStarting(true);
    try {
      router.push(`/jobs?jobId=${activeJob.id}`);
      onClose();
      onStartTimer(activeJob.id);
    } finally {
      setIsStarting(false);
    }
  }

  async function saveNotes() {
    if (!currentJob) {
      return;
    }

    const activeJob = currentJob;
    setIsSavingNotes(true);
    setNotesMessage('');

    try {
      const response = await fetch(`/api/jobs/${activeJob.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: notes }),
      });
      const data = (await response.json()) as { job?: Job; error?: string };

      if (!response.ok) {
        setNotesMessage(data.error ?? 'Could not save notes.');
        return;
      }

      const normalizedNotes = notes.trim() || null;
      setNotes(normalizedNotes ?? '');
      onJobUpdated?.(data.job ? { ...currentJob, ...data.job } : { ...currentJob, description: normalizedNotes });
      setNotesMessage('Notes saved.');
    } catch (error) {
      setNotesMessage(error instanceof Error ? error.message : 'Could not save notes.');
    } finally {
      setIsSavingNotes(false);
    }
  }

  const formattedDate = new Date(currentJob.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const exportRows = timeEntries.map((entry) => ({
    task: currentJob.title,
    project: currentJob.projectName,
    taskType: currentJob.taskTypeName ?? '',
    startedAt: new Date(entry.startedAt).toLocaleString(),
    endedAt: entry.endedAt ? new Date(entry.endedAt).toLocaleString() : '',
    minutes: entry.durationMinutes ?? '',
    note: entry.note ?? '',
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 px-3 py-5 md:px-6">
      <div className="flex max-h-[calc(100vh-2.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-slate-950/95 px-5 py-4 backdrop-blur md:px-6">
          <div className="min-w-0 flex-1">
            <h2 className="break-words text-xl font-bold text-white md:text-2xl">{currentJob.title}</h2>
            <p className="mt-2 text-sm text-slate-400">
              {currentJob.projectName}
              {currentJob.taskTypeName ? ` - ${currentJob.taskTypeName}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 md:px-6">
          <div className="grid gap-5 lg:grid-cols-[1.3fr_0.9fr]">
            <div className="space-y-5">
              <div className="rounded-2xl bg-slate-900/50 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Project notes</p>
                    <p className="mt-1 text-sm text-slate-300">Internal notes and task context.</p>
                  </div>
                  <button
                    type="button"
                    onClick={saveNotes}
                    disabled={isSavingNotes}
                    className="rounded-xl bg-cyan-300 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:opacity-50"
                  >
                    {isSavingNotes ? 'Saving...' : 'Save notes'}
                  </button>
                </div>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={8}
                  className="w-full resize-y rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-white placeholder-slate-500 outline-none focus:border-cyan-300/40 focus:ring-1 focus:ring-cyan-300/40"
                  placeholder="Add notes, measurements, print settings, blockers, client feedback..."
                />
                {notesMessage ? <p className="mt-2 text-sm text-cyan-100">{notesMessage}</p> : null}
              </div>

              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-5">
                <FileUploadInput jobId={currentJob.id} />
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-900/50 p-3">
                  <p className="text-xs uppercase tracking-widest text-slate-400">Status</p>
                  <p className="mt-1 text-sm font-semibold capitalize text-white">{currentJob.status}</p>
                </div>
                <div className="rounded-xl bg-slate-900/50 p-3">
                  <p className="text-xs uppercase tracking-widest text-slate-400">Created</p>
                  <p className="mt-1 text-sm font-semibold text-white">{formattedDate}</p>
                </div>
                <div className="rounded-xl bg-slate-900/50 p-3">
                  <p className="text-xs uppercase tracking-widest text-slate-400">Type</p>
                  <p className="mt-1 text-sm font-semibold text-white">{currentJob.taskTypeName || 'None'}</p>
                </div>
                <div className="rounded-xl bg-slate-900/50 p-3">
                  <p className="text-xs uppercase tracking-widest text-slate-400">Sessions</p>
                  <p className="mt-1 text-sm font-semibold text-white">{sessionCount}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Tracked time</p>
                <p className="mt-2 text-3xl font-semibold text-cyan-100">{Math.floor(trackedMinutes / 60)}h {trackedMinutes % 60}m</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Task report</p>
                    <p className="mt-1 text-sm text-slate-300">Export all tracked sessions for this task.</p>
                  </div>
                  <CsvExportButton
                    filename={`${currentJob.title.replace(/[^a-z0-9-]+/gi, '-').toLowerCase()}-report.csv`}
                    headers={['task', 'project', 'taskType', 'startedAt', 'endedAt', 'minutes', 'note']}
                    rows={exportRows}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 z-10 flex gap-3 border-t border-white/10 bg-slate-950/95 px-5 py-4 backdrop-blur md:px-6">
          <button
            onClick={handleStartTimer}
            disabled={isStarting}
            className="flex-1 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isStarting ? 'Going to timer...' : 'Start timer'}
          </button>
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
