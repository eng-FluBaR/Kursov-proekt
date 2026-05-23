'use client';

import { useEffect, useState } from 'react';

import { StatCard } from './workspace-ui';

type TimeEntry = {
  id: string;
  jobId: string | null;
  startedAt: string;
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

function isToday(isoString: string) {
  const date = new Date(isoString);
  const now = new Date();
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
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

  const todayMinutes = entries
    .filter((entry) => isToday(entry.startedAt))
    .reduce((sum, entry) => sum + (entry.durationMinutes ?? 0), 0);
  const totalMinutes = entries.reduce((sum, entry) => sum + (entry.durationMinutes ?? 0), 0);
  const runningEntries = entries.filter((entry) => !entry.endedAt).length;
  const activeJobs = jobs.filter((job) => job.status === 'active').length;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tracked today" value="..." detail="Loading your time" tone="cyan" />
        <StatCard label="Running timers" value="..." detail="Loading sessions" tone="emerald" />
        <StatCard label="Active jobs" value="..." detail="Loading jobs" tone="amber" />
        <StatCard label="Total tracked" value="..." detail="Loading history" tone="rose" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Tracked today" value={formatMinutes(todayMinutes)} detail="Only your sessions" tone="cyan" />
      <StatCard label="Running timers" value={String(runningEntries)} detail="Your active sessions" tone="emerald" />
      <StatCard label="Active jobs" value={String(activeJobs)} detail="Created by you" tone="amber" />
      <StatCard label="Total tracked" value={formatMinutes(totalMinutes)} detail={`${entries.length} time entries`} tone="rose" />
    </div>
  );
}
