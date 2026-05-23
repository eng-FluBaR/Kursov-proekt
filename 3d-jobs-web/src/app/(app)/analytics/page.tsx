'use client';

import { useEffect, useMemo, useState } from 'react';

import { DashboardUserStats } from '@/components/dashboard-user-stats';
import { Panel, SectionHeading } from '@/components/workspace-ui';

type TimeEntry = {
  id: string;
  projectName: string;
  jobTitle: string | null;
  taskTypeName: string | null;
  startedAt: string;
  durationMinutes: number | null;
};

const colors = ['#22d3ee', '#34d399', '#f59e0b', '#fb7185', '#a78bfa', '#60a5fa'];

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

function shortDate(isoString: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit' }).format(new Date(isoString));
}

export default function AnalyticsPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setError('');
        const response = await fetch('/api/time-entries');
        const data = (await response.json()) as { entries?: TimeEntry[]; error?: string };

        if (!response.ok) {
          throw new Error(data.error ?? 'Could not load analytics.');
        }

        setEntries(data.entries ?? []);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Could not load analytics.');
      } finally {
        setIsLoading(false);
      }
    }

    void Promise.resolve().then(loadAnalytics);
  }, []);

  const taskTypeRows = useMemo(() => {
    const totals = new Map<string, number>();

    for (const entry of entries) {
      const name = entry.taskTypeName ?? 'Other';
      totals.set(name, (totals.get(name) ?? 0) + (entry.durationMinutes ?? 0));
    }

    return Array.from(totals.entries())
      .map(([name, minutes], index) => ({ name, minutes, color: colors[index % colors.length] }))
      .sort((left, right) => right.minutes - left.minutes);
  }, [entries]);

  const taskTotal = taskTypeRows.reduce((sum, row) => sum + row.minutes, 0);
  const topTaskMinutes = Math.max(...taskTypeRows.map((row) => row.minutes), 1);
  const donutSegments = taskTypeRows.reduce(
    (chart, item) => {
      const nextOffset = chart.offset + (taskTotal > 0 ? (item.minutes / taskTotal) * 360 : 0);
      return {
        offset: nextOffset,
        segments: [...chart.segments, `${item.color} ${chart.offset}deg ${nextOffset}deg`],
      };
    },
    { offset: 0, segments: [] as string[] },
  );
  const donutStyle = {
    background: donutSegments.segments.length > 0
      ? `conic-gradient(${donutSegments.segments.join(', ')})`
      : 'rgba(255,255,255,0.08)',
  };

  const recentDayRows = useMemo(() => {
    const totals = new Map<string, { label: string; minutes: number }>();

    for (const entry of entries) {
      const key = entry.startedAt.slice(0, 10);
      const current = totals.get(key) ?? { label: shortDate(entry.startedAt), minutes: 0 };
      totals.set(key, { ...current, minutes: current.minutes + (entry.durationMinutes ?? 0) });
    }

    return Array.from(totals.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .slice(-14)
      .map(([, value]) => value);
  }, [entries]);

  const topDayMinutes = Math.max(...recentDayRows.map((row) => row.minutes), 1);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Analytics"
        title="Your work overview"
        description="These numbers are calculated only from your own tracked time."
      />

      <DashboardUserStats />

      {error ? <p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel className="p-6">
          <SectionHeading eyebrow="Task types" title="Time by task type" description="A breakdown of where your tracked minutes went." />
          {isLoading ? (
            <p className="py-8 text-center text-sm text-slate-300">Loading analytics...</p>
          ) : taskTypeRows.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-slate-950/60 px-6 py-8 text-center text-sm text-slate-400">No tracked time yet.</p>
          ) : (
            <div className="space-y-4">
              {taskTypeRows.map((row) => (
                <div key={row.name}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm text-slate-300">
                    <span>{row.name}</span>
                    <span>{formatMinutes(row.minutes)}</span>
                  </div>
                  <div className="h-4 rounded-full bg-white/5">
                    <div className="h-full rounded-full" style={{ width: `${(row.minutes / topTaskMinutes) * 100}%`, backgroundColor: row.color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel className="p-6">
          <SectionHeading eyebrow="Share" title="Task type split" description="Percent of your total tracked time." />
          <div className="flex flex-col items-center gap-5">
            <div className="relative h-52 w-52 rounded-full" style={donutStyle}>
              <div className="absolute inset-[28px] rounded-full border border-white/10 bg-slate-950/90" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xs uppercase text-slate-400">Total</p>
                  <p className="text-3xl font-semibold text-white">{formatMinutes(taskTotal)}</p>
                </div>
              </div>
            </div>
            <div className="grid w-full gap-2 sm:grid-cols-2">
              {taskTypeRows.map((item) => (
                <div key={item.name} className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-3 text-sm text-slate-200">
                  <span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name}: {taskTotal > 0 ? Math.round((item.minutes / taskTotal) * 100) : 0}%
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <Panel className="p-6">
        <SectionHeading eyebrow="Recent days" title="Tracked time per day" description="The last days with recorded work sessions." />
        <div className="grid min-h-48 grid-cols-7 items-end gap-3 md:grid-cols-[repeat(14,minmax(0,1fr))]">
          {recentDayRows.length === 0 ? (
            <p className="col-span-full py-8 text-center text-sm text-slate-400">No daily activity yet.</p>
          ) : (
            recentDayRows.map((row) => (
              <div key={row.label} className="flex h-44 flex-col justify-end gap-2">
                <div
                  className="min-h-2 rounded-t-xl bg-cyan-300/80"
                  style={{ height: `${Math.max(8, (row.minutes / topDayMinutes) * 150)}px` }}
                  title={formatMinutes(row.minutes)}
                />
                <span className="text-center text-[11px] text-slate-400">{row.label}</span>
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}
