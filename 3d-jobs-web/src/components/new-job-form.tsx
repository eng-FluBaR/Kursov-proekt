'use client';

import { useState } from 'react';

type Job = {
  id: string;
  projectName: string;
  taskTypeName: string | null;
  title: string;
  description: string | null;
  status: string;
};

type NewJobFormProps = {
  projects: Array<{ id: string; label: string }>;
  taskTypes: Array<{ id: string; label: string }>;
  onJobCreated?: (job: Job) => void;
};

export function NewJobForm({ projects, taskTypes, onJobCreated }: NewJobFormProps) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [taskTypeId, setTaskTypeId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          taskTypeId: taskTypeId || null,
          title,
          description: description || null,
        }),
      });

      const data = (await response.json()) as { job?: Job; error?: string };
      if (!response.ok) {
        setError(data.error ?? 'Failed to create job');
        return;
      }

      if (data.job) {
        onJobCreated?.(data.job);
        setTitle('');
        setDescription('');
      }
    } catch (err) {
      setError('Error creating job');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/60 p-6">
      <h3 className="text-lg font-semibold text-white">Create New Job</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm text-slate-300">Project</span>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300/40 focus:ring-1 focus:ring-cyan-300/40 cursor-pointer"
          >
            {projects.length === 0 ? (
              <option value="">No projects available</option>
            ) : (
              projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))
            )}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm text-slate-300">Task Type (optional)</span>
          <select
            value={taskTypeId}
            onChange={(e) => setTaskTypeId(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300/40 focus:ring-1 focus:ring-cyan-300/40 cursor-pointer"
          >
            <option value="">No task type</option>
            {taskTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="space-y-2">
        <span className="text-sm text-slate-300">Job Title</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter job title..."
          required
          className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-cyan-300/40 focus:ring-1 focus:ring-cyan-300/40"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm text-slate-300">Description (optional)</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add details about this job..."
          rows={3}
          className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-cyan-300/40 focus:ring-1 focus:ring-cyan-300/40"
        />
      </label>

      {error && <p className="text-sm text-rose-400">{error}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Creating...' : 'Create Job'}
      </button>
    </form>
  );
}
