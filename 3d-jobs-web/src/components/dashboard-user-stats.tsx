'use client';

import { useEffect, useState } from 'react';

import { StatCard } from './workspace-ui';

type TimeEntry = {
  id: string;
  jobId: string | null;
  endedAt: string | null;
  durationMinutes: number | null;
};

type Job = {
  id: string;
  status: string;
};

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

export function DashboardUserStats() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [entriesResponse, jobsResponse] = await Promise.all([
          fetch('/api/time-entries'),
          fetch('/api/jobs?status=all&ownOnly=true'),
        ]);

        const entriesData = (await entriesResponse.json()) as { entries?: TimeEntry[]; timeEntries?: TimeEntry[] };
        const jobsData = (await jobsResponse.json()) as { jobs?: Job[] };

        setEntries(entriesData.entries ?? entriesData.timeEntries ?? []);
        setJobs(jobsData.jobs ?? []);
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    void Promise.resolve().then(loadStats);
  }, []);

  const totalMinutes = entries.reduce((sum, entry) => sum + (entry.durationMinutes ?? 0), 0);
  const runningEntries = entries.filter((entry) => !entry.endedAt).length;
  const activeJobs = jobs.filter((job) => job.status === 'active').length;
  const completedJobs = jobs.filter((job) => job.status === 'completed').length;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total time" value="..." detail="Loading your time" tone="cyan" />
        <StatCard label="Active tasks" value="..." detail="Loading tasks" tone="amber" />
        <StatCard label="Completed tasks" value="..." detail="Loading tasks" tone="emerald" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard
        label="Total time"
        value={formatMinutes(totalMinutes)}
        detail={runningEntries > 0 ? `${runningEntries} running timer` : `${entries.length} time entries`}
        tone="cyan"
      />
      <StatCard
        label="Active tasks"
        value={String(activeJobs)}
        detail="Open current task list"
        tone="amber"
        href="/jobs"
      />
      <StatCard
        label="Completed tasks"
        value={String(completedJobs)}
        detail="Open completed task list"
        tone="emerald"
        href="/projects"
      />
    </div>
  );
}
