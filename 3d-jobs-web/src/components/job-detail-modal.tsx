'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
        return;
      }

      const response = await fetch(`/api/time-entries?jobId=${currentJob.id}`);
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as { entries: Array<{ durationMinutes: number | null }> };
      setSessionCount(data.entries.length);
      setTrackedMinutes(data.entries.reduce((sum, entry) => sum + (entry.durationMinutes ?? 0), 0));
    }

    fetchJobStats();
  }, [currentJob]);

  if (!currentJob) return null;

  if (loadedNotesJobId !== currentJob.id) {
    setLoadedNotesJobId(currentJob.id);
    setNotes(currentJob.description ?? '');
    setNotesMessage('');
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

  const formattedDate = new Date(job.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">{job.title}</h2>
            <p className="mt-2 text-sm text-slate-400">
              {job.projectName}
              {job.taskTypeName && ` • ${job.taskTypeName}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition"
          >
            ✕
          </button>
        </div>

        {/* Notes */}
        <div className="mb-6 rounded-2xl bg-slate-900/50 p-4">
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
            onChange={(event) => {
              setNotes(event.target.value);
            }}
            rows={4}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-300/40 focus:ring-1 focus:ring-cyan-300/40"
            placeholder="Add notes, measurements, print settings, blockers, client feedback..."
          />
          {notesMessage ? <p className="mt-2 text-sm text-cyan-100">{notesMessage}</p> : null}
        </div>

        {/* File Upload Section */}
        <div className="mb-6 rounded-2xl border border-dashed border-white/10 p-6 bg-white/5">
          <FileUploadInput jobId={currentJob.id} />
        </div>

        {/* Metadata */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl bg-slate-900/50 p-3">
            <p className="text-xs text-slate-400 uppercase tracking-widest">Status</p>
            <p className="mt-1 text-sm font-semibold capitalize text-white">{job.status}</p>
          </div>
          <div className="rounded-xl bg-slate-900/50 p-3">
            <p className="text-xs text-slate-400 uppercase tracking-widest">Created</p>
            <p className="mt-1 text-sm font-semibold text-white">{formattedDate}</p>
          </div>
          <div className="rounded-xl bg-slate-900/50 p-3">
            <p className="text-xs text-slate-400 uppercase tracking-widest">Type</p>
            <p className="mt-1 text-sm font-semibold text-white">{currentJob.taskTypeName || 'None'}</p>
          </div>
          <div className="rounded-xl bg-slate-900/50 p-3">
            <p className="text-xs text-slate-400 uppercase tracking-widest">Tracked</p>
            <p className="mt-1 text-sm font-semibold text-cyan-200">{Math.floor(trackedMinutes / 60)}h {trackedMinutes % 60}m</p>
          </div>
          <div className="rounded-xl bg-slate-900/50 p-3">
            <p className="text-xs text-slate-400 uppercase tracking-widest">Sessions</p>
            <p className="mt-1 text-sm font-semibold text-white">{sessionCount}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleStartTimer}
            disabled={isStarting}
            className="flex-1 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStarting ? 'Going to timer...' : '▶ Start timer'}
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
