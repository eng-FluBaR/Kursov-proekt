'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Option = {
  id: string;
  label: string;
  color: string;
};

type Job = {
  id: string;
  projectId: string;
  projectName: string;
  taskTypeName: string | null;
  title: string;
  status: string;
  totalDurationMinutes?: number; // Идва от бекенда
};

type TimeEntry = {
  id: string;
  projectId: string;
  projectName: string;
  jobId: string | null;
  taskTypeId: string | null;
  taskTypeName: string | null;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
  note: string | null;
};

function formatMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
}

function formatElapsedTime(totalSeconds: number) {
  if (totalSeconds <= 0) {
    return '00h 00m 00s';
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

export function DashboardTimer(props: { projects: Option[]; taskTypes: Option[] }) {
  void props;
  const searchParams = useSearchParams();
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

   // Fetch active timer and available jobs on mount
   useEffect(() => {
     async function fetchData() {
       try {
         // Fetch active jobs
         const jobsResponse = await fetch('/api/mobile/time-entries?status=active');
         const jobsData = (await jobsResponse.json()) as { jobs: Job[] };
         setActiveJobs(jobsData.jobs || []);
         
         // Check if jobId is in query params first
         const jobIdParam = searchParams.get('jobId');
         
         // Fetch active timer
         const timerResponse = await fetch('/api/time-entries/active');
         const timerData = (await timerResponse.json()) as { entry: TimeEntry | null };
         
         if (timerData.entry) {
           console.log('Active entry found:', timerData.entry);
           setActiveEntry(timerData.entry);
           // Use jobId from active entry if available
           if (timerData.entry.jobId) {
             setSelectedJobId(timerData.entry.jobId);
           } else if (jobIdParam) {
             setSelectedJobId(jobIdParam);
           } else if (jobsData.jobs && jobsData.jobs.length > 0) {
             setSelectedJobId(jobsData.jobs[0].id);
           }
           setRunning(true);
           // Calculate elapsed time since started
           const startTime = new Date(timerData.entry.startedAt).getTime();
           const now = Date.now();
           setElapsed(Math.floor((now - startTime) / 1000));
         } else {
           console.log('No active entry found');
           // No active timer, use jobIdParam or first job
           if (jobIdParam) {
             setSelectedJobId(jobIdParam);
           } else if (jobsData.jobs && jobsData.jobs.length > 0) {
             setSelectedJobId(jobsData.jobs[0].id);
           }
         }
       } catch (err) {
         console.error('Failed to fetch data:', err);
       } finally {
         setIsLoading(false);
       }
     }
     fetchData();
   }, [searchParams]);

  // Handle timer tick
  useEffect(() => {
    if (!running) {
      return;
    }

    const interval = window.setInterval(() => {
      setElapsed((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [running]);

  async function handleStartTimer() {
    setError('');
    if (!selectedJobId) {
      setError('Please select a job first');
      return;
    }

    console.log('Starting timer for job:', selectedJobId);
    setIsLoading(true);
    try {
      // Find selected job to get project details
      const selectedJob = activeJobs.find((j) => j.id === selectedJobId);
      if (!selectedJob) {
        setError('Job not found');
        return;
      }

      // If there's an active entry, stop it first
      if (activeEntry) {
        console.log('Stopping previous active entry:', activeEntry.id);
        await fetch(`/api/time-entries/${activeEntry.id}/stop`, {
          method: 'PATCH',
        });
      }

      // Create new entry with jobId
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedJob.projectId,
          jobId: selectedJobId,
          startedAt: new Date().toISOString(),
        }),
      });

      console.log('Start response status:', response.status);
      const data = (await response.json()) as { entry?: TimeEntry; error?: string };
      console.log('Start response data:', data);

      if (!response.ok) {
        setError(data.error ?? 'Failed to start timer');
        return;
      }

      setActiveEntry(data.entry ?? null);
      console.log('Active entry set to:', data.entry);
      if (data.entry?.id) {
        console.log('Entry ID:', data.entry.id);
      } else {
        console.warn('WARNING: Entry has no ID!', data.entry);
      }
      setElapsed(0);
      setRunning(true);
      console.log('Timer started successfully');
    } catch (err) {
      setError('Error starting timer');
      console.error('Start timer error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStopTimer() {
    setError('');
    if (!activeEntry) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/time-entries/${activeEntry.id}/stop`, {
        method: 'PATCH',
      });

      const data = (await response.json()) as { entry?: TimeEntry; error?: string };

      if (!response.ok) {
        setError(data.error ?? 'Failed to stop timer');
        // Even if API fails, we still reset the timer state locally
        // to prevent the UI from showing a stuck timer
        setActiveEntry(null);
        setElapsed(0);
        setRunning(false);
        return;
      }

      setActiveEntry(null);
      setElapsed(0);
      setRunning(false);
    } catch (err) {
      setError('Error stopping timer');
      console.error(err);
      // Even if there's an exception, we still reset the timer state locally
      setActiveEntry(null);
      setElapsed(0);
      setRunning(false);
    } finally {
      setIsLoading(false);
    }
  }


  const selectedJob = activeJobs.find((j) => j.id === selectedJobId);

  if (isLoading) {
    return <div className="text-slate-300">Loading...</div>;
  }

  if (activeJobs.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6 text-center">
        <p className="text-slate-400">No active jobs yet. Create a job first to start tracking time.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-slate-400">Active timer</p>
            <h3 className="mt-2 text-4xl font-semibold text-white tabular-nums">{formatElapsedTime(elapsed)}</h3>
            <p className="mt-2 text-sm text-slate-300">{running ? 'Tracking live in seconds' : 'Timer idle'}</p>
          </div>
          <button
            type="button"
            onClick={running ? handleStopTimer : handleStartTimer}
            disabled={isLoading}
            className={`rounded-2xl px-5 py-3 text-sm font-semibold transition disabled:opacity-50 ${
              running ? 'bg-rose-400 text-slate-950 hover:bg-rose-300' : 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'
            }`}
          >
            {running ? 'Stop timer' : 'Start timer'}
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}

        <div className="mt-6">
          <label className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">Select Job</span>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              disabled={running}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none ring-0 transition focus:border-cyan-300/40 focus:ring-1 focus:ring-cyan-300/40 disabled:opacity-50 cursor-pointer"
            >
              {activeJobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} • {job.projectName}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {selectedJob && (
            <>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">{selectedJob.title}</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">{selectedJob.projectName}</span>
              {selectedJob.taskTypeName && <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">{selectedJob.taskTypeName}</span>}
            </>
          )}
          <span className={`rounded-full px-4 py-2 text-sm ${running ? 'border border-emerald-400/20 bg-emerald-400/10 text-emerald-100' : 'border border-slate-400/20 bg-slate-400/10 text-slate-300'}`}>
            {running ? 'Timer live' : 'Idle'}
          </span>
        </div>
      </div>

      <div className="grid gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-400/10 via-white/5 to-amber-300/10 p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-slate-400">Current job</p>
          {selectedJob ? (
            <>
              <p className="mt-3 text-2xl font-semibold text-white">{selectedJob.title}</p>
              <p className="mt-2 text-sm text-slate-300">{selectedJob.projectName}</p>
            </>
          ) : (
            <p className="mt-3 text-slate-400">No job selected</p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Session Time</p>
            <p className="mt-2 text-xl font-semibold text-white tabular-nums">{formatElapsedTime(elapsed)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Total for Job</p>
            <p className="mt-2 text-xl font-semibold text-cyan-300">
              {formatMinutes(selectedJob?.totalDurationMinutes ?? 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
