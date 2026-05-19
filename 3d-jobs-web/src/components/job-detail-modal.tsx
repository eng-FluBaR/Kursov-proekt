'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
};

export function JobDetailModal({ job, onClose, onStartTimer }: JobDetailModalProps) {
  const [isStarting, setIsStarting] = useState(false);
  const router = useRouter();

  if (!job) return null;

  async function handleStartTimer() {
    setIsStarting(true);
    try {
      // Navigate to dashboard with job ID as query param
      router.push(`/dashboard?jobId=${job.id}`);
      onClose();
      onStartTimer(job.id);
    } finally {
      setIsStarting(false);
    }
  }

  const formattedDate = new Date(job.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

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

        {/* Description */}
        {job.description && (
          <div className="mb-6 rounded-2xl bg-slate-900/50 p-4">
            <p className="text-slate-300">{job.description}</p>
          </div>
        )}

        {/* Metadata */}
        <div className="mb-6 grid grid-cols-3 gap-4">
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
            <p className="mt-1 text-sm font-semibold text-white">{job.taskTypeName || 'None'}</p>
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
