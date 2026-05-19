'use client';

import { useEffect, useState } from 'react';

type TimeEntry = {
  id: string;
  projectId: string;
  projectName: string;
  taskTypeId: string | null;
  taskTypeName: string | null;
  startedAt: string;
  endedAt?: string | null;
  durationMinutes: number | null;
  note: string | null;
};

function formatDuration(minutes: number | null) {
  if (!minutes) return '--:--';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function formatDateTime(isoString: string) {
  const date = new Date(isoString);
  return {
    date: date.toLocaleDateString('bg-BG', { month: '2-digit', day: '2-digit', year: 'numeric' }),
    time: date.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' }),
  };
}

export function TimeEntriesList({ projectId }: { projectId?: string }) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchEntries() {
      try {
        let url = '/api/time-entries';
        if (projectId) {
          url += `?projectId=${projectId}`;
        }
        const response = await fetch(url);
        const data = (await response.json()) as { entries: TimeEntry[] };
        setEntries(data.entries || []);
      } catch (err) {
        console.error('Failed to fetch entries:', err);
        setError('Failed to load time entries');
      } finally {
        setIsLoading(false);
      }
    }
    fetchEntries();
  }, [projectId]);

  if (isLoading) {
    return <div className="text-slate-300">Loading...</div>;
  }

  if (error) {
    return <div className="text-rose-400">{error}</div>;
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-6 py-8 text-center">
        <p className="text-slate-400">No time entries yet. Start the timer to begin tracking.</p>
      </div>
    );
  }

  // Group entries by date
  const groupedByDate = entries.reduce(
    (acc, entry) => {
      const dateStr = new Date(entry.startedAt).toLocaleDateString('bg-BG');
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(entry);
      return acc;
    },
    {} as Record<string, TimeEntry[]>
  );

  return (
    <div className="space-y-6">
      {Object.entries(groupedByDate).map(([dateStr, dayEntries]) => (
        <div key={dateStr}>
          <h3 className="mb-3 text-sm font-semibold text-slate-300">{dateStr}</h3>
          <div className="space-y-2">
            {dayEntries.map((entry) => {
              const start = formatDateTime(entry.startedAt);
              const taskLabel = entry.taskTypeName || 'No task type';
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4"
                >
                  <div className="flex flex-1 items-center gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-white">{entry.projectName}</p>
                      <p className="text-sm text-slate-400">
                        {taskLabel} • {start.time}
                      </p>
                      {entry.note && <p className="mt-1 text-xs text-slate-500">{entry.note}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-white">{formatDuration(entry.durationMinutes)}</p>
                    <p className="text-xs text-slate-400">
                      {entry.endedAt ? 'Completed' : 'In progress'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
