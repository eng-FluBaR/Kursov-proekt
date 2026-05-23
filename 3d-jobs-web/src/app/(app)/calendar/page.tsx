'use client';

import { useEffect, useState } from 'react';

import { Panel, SectionHeading } from '@/components/workspace-ui';

type Job = {
  id: string;
  title: string;
  projectName: string | null;
  taskTypeName: string | null;
  status: string;
  createdAt: string;
};

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState('');
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7;

  useEffect(() => {
    async function loadJobs() {
      try {
        const response = await fetch('/api/jobs?status=all&ownOnly=true');
        const data = (await response.json()) as { jobs?: Job[]; error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? 'Could not load calendar jobs.');
        }
        setJobs(data.jobs ?? []);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Could not load calendar jobs.');
      }
    }

    void Promise.resolve().then(loadJobs);
  }, []);

  const jobsByDay: Record<number, Job[]> = {};
  for (const job of jobs) {
    const created = new Date(job.createdAt);
    if (created.getFullYear() === year && created.getMonth() === month) {
      const day = created.getDate();
      jobsByDay[day] = [...(jobsByDay[day] ?? []), job];
    }
  }

  const upcoming = jobs
    .filter((job) => new Date(job.createdAt).getMonth() === month)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Calendar"
        title={today.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
        description="Only tasks created by the current user are marked here."
      />

      {error ? <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel className="p-6">
          <div className="grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-[0.22em] text-slate-400">
            {weekdays.map((day) => <div key={day}>{day}</div>)}
          </div>

          <div className="mt-3 grid grid-cols-7 gap-2">
            {Array.from({ length: firstDayOffset }).map((_, index) => <div key={`blank-${index}`} className="h-28 rounded-2xl border border-white/5 bg-white/3" />)}
            {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((day) => {
              const dayJobs = jobsByDay[day] ?? [];
              return (
                <div key={day} className="min-h-28 rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span className="font-semibold text-white">{day}</span>
                    {dayJobs.length > 0 ? <span className="rounded-full bg-cyan-400/15 px-2 py-0.5 text-[11px] text-cyan-100">{dayJobs.length}</span> : null}
                  </div>
                  <div className="mt-3 space-y-2">
                    {dayJobs.slice(0, 3).map((job) => (
                      <div key={job.id} className="rounded-xl border border-cyan-300/20 bg-cyan-300/15 px-2 py-2 text-xs text-cyan-50">
                        <div className="truncate font-semibold">{job.title}</div>
                        <div className="mt-1 truncate text-[11px] text-cyan-100/75">{job.taskTypeName ?? job.projectName ?? 'Task'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel className="p-6">
          <SectionHeading eyebrow="Created tasks" title="This month" description="A compact list of your own tasks created in the selected month." />
          <div className="space-y-3">
            {upcoming.length === 0 ? <p className="text-sm text-slate-400">No tasks created this month.</p> : null}
            {upcoming.map((job) => (
              <div key={job.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-sm font-semibold text-white">{job.title}</p>
                <p className="mt-1 text-sm text-slate-400">{new Date(job.createdAt).toLocaleDateString()} - {job.status}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
