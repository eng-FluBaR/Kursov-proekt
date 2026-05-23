'use client';

import { useEffect, useState, useCallback } from 'react';
import { JobDetailModal } from './job-detail-modal';

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

type JobsListProps = {
  refreshToken?: number;
};

export function JobsList({ refreshToken = 0 }: JobsListProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('active');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Функцията е обвита в useCallback, за да работи правилно с useEffect
  const fetchJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Увери се, че този път съвпада с твоя API
      const url = `/api/mobile/time-entries?status=${status}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Неуспешно зареждане на задачите.');
      }

      const data = (await response.json()) as { jobs: Job[] };
      console.log('Fetched jobs:', data.jobs); // Дебъг лог
      setJobs(data.jobs || []);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setError('Възникна грешка при зареждането на задачите.');
    } finally {
      console.log('fetchJobs finished. isLoading set to false.');
      setIsLoading(false);
    }
  }, [status]);

  // Задейства се при първо зареждане, промяна на таб (status) или рефреш
  useEffect(() => {
    void Promise.resolve().then(fetchJobs);
  }, [fetchJobs, refreshToken]);

  async function handleStatusChange(jobId: string, newStatus: string) {
    try {
      setIsUpdating(jobId);
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Оптимистично обновяваме локалния стейт за по-бърза реакция
        setJobs(prev => prev.filter(job => job.id !== jobId));
      }
    } catch (err) {
      console.error('Failed to update job:', err);
    } finally {
      setIsUpdating(null);
    }
  }

  async function handleStartTimer(jobId: string) {
    console.log('Starting timer for job:', jobId);
    setSelectedJob(null);
  }

  return (
    <>
      <div className="space-y-4">
        {/* Бутони за филтриране по статус */}
        <div className="flex gap-2">
          <button
            onClick={() => setStatus('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              status === 'active'
                ? 'bg-cyan-400/20 text-cyan-100 border border-cyan-400/30'
                : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatus('completed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              status === 'completed'
                ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-400/30'
                : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setStatus('paused')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              status === 'paused'
                ? 'bg-amber-400/20 text-amber-100 border border-amber-400/30'
                : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
            }`}
          >
            Paused
          </button>
        </div>

        {/* Секция със състоянията на списъка */}
        {isLoading ? (
          <div className="text-slate-300 py-8 text-center text-sm">Loading jobs...</div>
        ) : error ? (
          <div className="text-rose-400 py-8 text-center text-sm">{error}</div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-6 py-8 text-center">
            <p className="text-slate-400">No {status} jobs yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => isUpdating !== job.id && setSelectedJob(job)}
                className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 cursor-pointer transition hover:bg-slate-900/80 hover:border-cyan-400/30"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{job.title}</h4>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <span className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                        📁 {job.projectName}
                      </span>
                      {job.taskTypeName && (
                        <span className="text-xs font-medium text-cyan-300 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">
                          🏷️ {job.taskTypeName}
                        </span>
                      )}
                    </div>
                    {job.description && <p className="mt-2 text-sm text-slate-300">{job.description}</p>}
                  </div>
                  <select
                    value={job.status}
                    disabled={isUpdating === job.id}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleStatusChange(job.id, e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/40 focus:ring-1 focus:ring-cyan-300/40 cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <JobDetailModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onStartTimer={handleStartTimer}
      />
    </>
  );
}
