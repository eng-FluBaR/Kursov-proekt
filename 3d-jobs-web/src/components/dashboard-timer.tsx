'use client';

import { useEffect, useState } from 'react';

type Option = {
  id: string;
  label: string;
  color: string;
};

function formatTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}

export function DashboardTimer({ projects, taskTypes }: { projects: Option[]; taskTypes: Option[] }) {
  const [running, setRunning] = useState(true);
  const [elapsed, setElapsed] = useState(7 * 3600 + 42 * 60);
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [taskTypeId, setTaskTypeId] = useState(taskTypes[0]?.id ?? '');

  useEffect(() => {
    if (!running) {
      return;
    }

    const interval = window.setInterval(() => {
      setElapsed((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [running]);

  const selectedProject = projects.find((project) => project.id === projectId) ?? projects[0];
  const selectedTaskType = taskTypes.find((taskType) => taskType.id === taskTypeId) ?? taskTypes[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
      <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-slate-400">Active timer</p>
            <h3 className="mt-2 text-4xl font-semibold text-white tabular-nums">{formatTime(elapsed)}</h3>
            <p className="mt-2 text-sm text-slate-300">{running ? 'Counting up in real time' : 'Timer paused'}</p>
          </div>
          <button
            type="button"
            onClick={() => setRunning((current) => !current)}
            className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${running ? 'bg-rose-400 text-slate-950 hover:bg-rose-300' : 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'}`}
          >
            {running ? 'Stop timer' : 'Start timer'}
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">Project</span>
            <select
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-0 transition focus:border-cyan-300/40"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">Task type</span>
            <select
              value={taskTypeId}
              onChange={(event) => setTaskTypeId(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none ring-0 transition focus:border-cyan-300/40"
            >
              {taskTypes.map((taskType) => (
                <option key={taskType.id} value={taskType.id}>
                  {taskType.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">{selectedProject?.label}</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">{selectedTaskType?.label}</span>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-100">{running ? 'Timer live' : 'Manual mode'}</span>
        </div>
      </div>

      <div className="grid gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-400/10 via-white/5 to-amber-300/10 p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-slate-400">Current focus</p>
          <p className="mt-3 text-2xl font-semibold text-white">{selectedProject?.label}</p>
          <p className="mt-2 text-sm text-slate-300">{selectedTaskType?.label} session in progress. Keep the timer attached to the active project.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Elapsed</p>
            <p className="mt-2 text-2xl font-semibold text-white tabular-nums">{formatTime(elapsed)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Status</p>
            <p className="mt-2 text-2xl font-semibold text-white">{running ? 'Tracking' : 'Paused'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}