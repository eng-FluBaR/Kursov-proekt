'use client';

import { useEffect, useState } from 'react';

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

export function JobsList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('active');

  useEffect(() => {
    fetchJobs();
  }, [status]);

  async function fetchJobs() {
    try {
      const url = `/api/jobs?status=${status}`;
      const response = await fetch(url);
      const data = (await response.json()) as { jobs: Job[] };
      setJobs(data.jobs || []);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setError('Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStatusChange(jobId: string, newStatus: string) {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Refresh list
        fetchJobs();
      }
    } catch (err) {
      console.error('Failed to update job:', err);
    }
  }

  if (isLoading) {
    return <div className="text-slate-300">Loading jobs...</div>;
  }

  if (error) {
    return <div className="text-rose-400">{error}</div>;
  }

  return (
    <div className="space-y-4">
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

      {jobs.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-6 py-8 text-center">
          <p className="text-slate-400">No {status} jobs yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{job.title}</h4>
                  <p className="mt-1 text-sm text-slate-400">
                    {job.projectName}
                    {job.taskTypeName && ` • ${job.taskTypeName}`}
                  </p>
                  {job.description && <p className="mt-2 text-sm text-slate-300">{job.description}</p>}
                </div>
                <select
                  value={job.status}
                  onChange={(e) => handleStatusChange(job.id, e.target.value)}
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
  );
}
