'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

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
  userId?: string;
  ownerEmail?: string | null;
  isShared?: boolean;
  createdAt: string;
};

type JobsListProps = {
  refreshToken?: number;
  initialStatus?: string;
  lockStatus?: boolean;
  ownOnly?: boolean;
  sharedOnly?: boolean;
  readOnlyStatus?: boolean;
};

export function JobsList({
  refreshToken = 0,
  initialStatus = 'active',
  lockStatus = false,
  ownOnly = false,
  sharedOnly = false,
  readOnlyStatus = false,
}: JobsListProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState(initialStatus);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      const params = new URLSearchParams({ status });
      if (ownOnly) {
        params.set('ownOnly', 'true');
      }
      if (sharedOnly) {
        params.set('sharedOnly', 'true');
      }

      const response = await fetch(`/api/mobile/time-entries?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Could not load jobs.');
      }

      const data = (await response.json()) as { jobs: Job[] };
      const loadedJobs = data.jobs || [];
      setJobs(loadedJobs);

      const requestedJobId = searchParams.get('jobId');
      const timerSelectionOnly = searchParams.get('timer') === '1';
      if (requestedJobId && !timerSelectionOnly && !selectedJob) {
        const visibleJob = loadedJobs.find((job) => job.id === requestedJobId);
        if (visibleJob) {
          setSelectedJob(visibleJob);
        } else {
          const allResponse = await fetch('/api/jobs?status=all');
          const allData = (await allResponse.json()) as { jobs?: Job[] };
          const requestedJob = allData.jobs?.find((job) => job.id === requestedJobId);
          if (requestedJob) {
            setSelectedJob(requestedJob as Job);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setError('Could not load jobs.');
    } finally {
      setIsLoading(false);
    }
  }, [ownOnly, searchParams, selectedJob, sharedOnly, status]);

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
        setJobs((currentJobs) => currentJobs.filter((job) => job.id !== jobId));
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

  function closeSelectedJob() {
    setSelectedJob(null);

    const params = new URLSearchParams(searchParams.toString());
    params.delete('jobId');
    params.delete('timer');

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }

  function handleJobUpdated(updatedJob: Job) {
    setJobs((currentJobs) => currentJobs.map((job) => job.id === updatedJob.id ? { ...job, ...updatedJob } : job));
    setSelectedJob((currentJob) => currentJob?.id === updatedJob.id ? { ...currentJob, ...updatedJob } : currentJob);
  }

  return (
    <>
      <div className="space-y-4">
        <div className={`flex gap-2 ${lockStatus ? 'hidden' : ''}`}>
          {['active', 'completed', 'paused'].map((item) => (
            <button
              key={item}
              onClick={() => setStatus(item)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium capitalize transition ${
                status === item
                  ? 'border-cyan-400/30 bg-cyan-400/20 text-cyan-100'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-slate-300">Loading jobs...</div>
        ) : error ? (
          <div className="py-8 text-center text-sm text-rose-400">{error}</div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-6 py-8 text-center">
            <p className="text-slate-400">No {sharedOnly ? 'shared' : status} jobs yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => isUpdating !== job.id && setSelectedJob(job)}
                className="cursor-pointer rounded-2xl border border-white/10 bg-slate-950/60 p-4 transition hover:border-cyan-400/30 hover:bg-slate-900/80"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-white">{job.title}</h4>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-slate-400">
                        Project: {job.projectName}
                      </span>
                      {job.taskTypeName ? (
                        <span className="rounded border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-xs font-medium text-cyan-300">
                          Type: {job.taskTypeName}
                        </span>
                      ) : null}
                      {job.isShared ? (
                        <span className="rounded border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-xs font-medium text-amber-100">
                          Shared by {job.ownerEmail ?? 'another user'}
                        </span>
                      ) : null}
                    </div>
                    {job.description ? <p className="mt-2 text-sm text-slate-300">{job.description}</p> : null}
                  </div>
                  {readOnlyStatus || job.isShared ? (
                    <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm capitalize text-slate-300">{job.status}</span>
                  ) : (
                    <select
                      value={job.status}
                      disabled={isUpdating === job.id}
                      onChange={(event) => {
                        event.stopPropagation();
                        void handleStatusChange(job.id, event.target.value);
                      }}
                      onClick={(event) => event.stopPropagation()}
                      className="cursor-pointer rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/40 focus:ring-1 focus:ring-cyan-300/40"
                    >
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <JobDetailModal
        job={selectedJob}
        onClose={closeSelectedJob}
        onStartTimer={handleStartTimer}
        onJobUpdated={handleJobUpdated}
      />
    </>
  );
}
