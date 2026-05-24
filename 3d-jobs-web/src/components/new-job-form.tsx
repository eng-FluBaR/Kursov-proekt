'use client';

import { useState } from 'react';

import { PreviewHint, usePreviewMode } from './preview-hint';

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
  const { isPreviewMode } = usePreviewMode();
  const [taskTypeId, setTaskTypeId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedProjectId = projects[0]?.id ?? '';
  const selectedTaskTypeId = taskTypes.some((taskType) => taskType.id === taskTypeId)
    ? taskTypeId
    : taskTypes[0]?.id ?? '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!title.trim()) {
      setError('Task name is required.');
      setIsLoading(false);
      return;
    }

    if (!selectedProjectId) {
      setError('No project is available for this account.');
      setIsLoading(false);
      return;
    }

    if (!selectedTaskTypeId) {
      setError('Please select a task type.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/mobile/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          taskTypeId: selectedTaskTypeId,
          title,
          description: description || null,
        }),
      });

      let data: { job?: Job; error?: string } = {};
      try {
        data = await response.json();
      } catch {
        throw new Error(`Server returned ${response.status} but not valid JSON.`);
      }

      if (!response.ok) {
        setError(data.error ?? `Failed to create job (${response.status})`);
        return;
      }

      if (data.job) {
        onJobCreated?.(data.job);
        setTitle('');
        setDescription('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating job');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/60 p-6">
      <h3 className="text-lg font-semibold text-white">Create New Task</h3>
      <PreviewHint compact>
        Тук след login се създава задача: избираш тип работа, пишеш име и добавяш кратки бележки за контекст.
      </PreviewHint>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm text-slate-300">Task name</span>
          {isPreviewMode ? <span className="block text-xs leading-5 text-slate-400">Името е основният етикет на задачата в списъци, календар и отчети.</span> : null}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task name..."
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-cyan-300/40 focus:ring-1 focus:ring-cyan-300/40"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm text-slate-300">Task type</span>
          {isPreviewMode ? <span className="block text-xs leading-5 text-slate-400">Типът групира времето по дейност, например modeling, printing или review.</span> : null}
          <select
            value={selectedTaskTypeId}
            onChange={(e) => setTaskTypeId(e.target.value)}
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-300/40 focus:ring-1 focus:ring-cyan-300/40 cursor-pointer"
          >
            {taskTypes.length === 0 ? (
              <option value="">No task types available</option>
            ) : (
              taskTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))
            )}
          </select>
        </label>
      </div>

      <label className="space-y-2">
        <span className="text-sm text-slate-300">Notes / description (optional)</span>
        {isPreviewMode ? <span className="block text-xs leading-5 text-slate-400">Бележките пазят изисквания, настройки, блокери или инструкции към задачата.</span> : null}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add notes about this task..."
          rows={3}
          className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-cyan-300/40 focus:ring-1 focus:ring-cyan-300/40"
        />
      </label>

      {error && <p className="text-sm text-rose-400">{error}</p>}

      <button
        type="submit"
        disabled={isLoading || projects.length === 0 || taskTypes.length === 0}
        className="w-full rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading
          ? 'Creating...'
          : projects.length === 0
            ? 'No project available'
            : taskTypes.length === 0
              ? 'No task types available'
              : 'Create Task'}
      </button>
    </form>
  );
}
