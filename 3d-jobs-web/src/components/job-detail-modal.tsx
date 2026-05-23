'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

import { FileUploadInput } from './UI';
import { JobWordReportButton } from './job-word-report-button';

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
  const [isMounted, setIsMounted] = useState(false);
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
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [notesMessage, setNotesMessage] = useState('');
  const [loadedNotesJobId, setLoadedNotesJobId] = useState<string | null>(null);
  const notesTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const router = useRouter();
  const currentJob = job;

  useEffect(() => {
    queueMicrotask(() => setIsMounted(true));
  }, []);

  useEffect(() => {
    if (!currentJob) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentJob, onClose]);

  function resizeNotesTextarea() {
    const textarea = notesTextareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

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

  useEffect(() => {
    resizeNotesTextarea();
  }, [notes]);

  if (!currentJob || !isMounted) {
    return null;
  }

  async function handleStartTimer() {
    if (!currentJob) {
      return;
    }

    const activeJob = currentJob;
    setIsStarting(true);
    try {
      router.push(`/jobs?jobId=${activeJob.id}&timer=1`);
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

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 md:px-8">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-slate-950/95 py-4 backdrop-blur">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/80">Task details</p>
            <h2 className="mt-2 max-w-4xl break-words text-2xl font-bold leading-tight text-white md:text-3xl">{currentJob.title}</h2>
            <p className="mt-2 text-base text-slate-300">
              {currentJob.projectName}
              {currentJob.taskTypeName ? ` - ${currentJob.taskTypeName}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="space-y-6 py-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Status</p>
              <p className="mt-1 text-sm font-semibold capitalize text-white">{currentJob.status}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Created</p>
              <p className="mt-1 text-sm font-semibold text-white">{formattedDate}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Type</p>
              <p className="mt-1 text-sm font-semibold text-white">{currentJob.taskTypeName || 'None'}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Tracked</p>
              <p className="mt-1 text-sm font-semibold text-cyan-100">{Math.floor(trackedMinutes / 60)}h {trackedMinutes % 60}m</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">Sessions</p>
              <p className="mt-1 text-sm font-semibold text-white">{sessionCount}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Project notes</p>
                <p className="mt-1 text-base text-slate-300">Internal notes and task context.</p>
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
              ref={notesTextareaRef}
              value={notes}
              onChange={(event) => {
                setNotes(event.target.value);
                requestAnimationFrame(resizeNotesTextarea);
              }}
              rows={1}
              className="min-h-40 w-full resize-none overflow-hidden rounded-2xl border border-white/10 bg-slate-950 px-5 py-4 text-lg leading-8 text-white placeholder-slate-500 outline-none focus:border-cyan-300/40 focus:ring-1 focus:ring-cyan-300/40"
              placeholder="Add notes, measurements, print settings, blockers, client feedback..."
            />
            {notesMessage ? <p className="mt-2 text-sm text-cyan-100">{notesMessage}</p> : null}
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/70 p-5">
              <FileUploadInput jobId={currentJob.id} onUploadStateChange={setIsUploadingFile} />
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
              <div className="flex h-full flex-col justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Task report</p>
                  <p className="mt-1 text-sm text-slate-300">Export all tracked sessions for this task.</p>
                </div>
                <JobWordReportButton
                  job={currentJob}
                  notes={notes}
                  timeEntries={timeEntries}
                  trackedMinutes={trackedMinutes}
                  sessionCount={sessionCount}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 z-10 flex gap-3 border-t border-white/10 bg-slate-950/95 py-4 backdrop-blur">
          <button
            type="button"
            onClick={handleStartTimer}
            disabled={isStarting}
            className="flex-1 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isStarting ? 'Going to timer...' : 'Start timer'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
          >
            {isUploadingFile ? 'Close while upload continues' : 'Close'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
