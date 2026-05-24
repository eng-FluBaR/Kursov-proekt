'use client';

import { Suspense, useEffect, useState } from 'react';

import { DashboardTimer } from '@/components/dashboard-timer';
import { JobsList } from '@/components/jobs-list';
import { NewJobForm } from '@/components/new-job-form';
import { PreviewHint } from '@/components/preview-hint';
import { Panel, SectionHeading } from '@/components/workspace-ui';

type ProjectResponse = {
  projects: Array<{ id: string; name: string }>;
};

type TaskTypeResponse = {
  taskTypes: Array<{ id: string; name: string }>;
};

type TaskView = 'active' | 'paused' | 'shared';

const taskViews: Array<{ id: TaskView; label: string; title: string; description: string }> = [
  {
    id: 'active',
    label: 'Active',
    title: 'Active tasks',
    description: 'Your own tasks that are ready to work on now.',
  },
  {
    id: 'paused',
    label: 'Paused',
    title: 'Paused tasks',
    description: 'Your paused tasks stay here so the main list remains clean.',
  },
  {
    id: 'shared',
    label: 'Shared',
    title: 'Shared tasks',
    description: 'Tasks shared with you by other users, separate from your own work.',
  },
];

export default function JobsPage() {
  const [projects, setProjects] = useState<Array<{ id: string; label: string }>>([]);
  const [taskTypes, setTaskTypes] = useState<Array<{ id: string; label: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);
  const [taskView, setTaskView] = useState<TaskView>('active');

  useEffect(() => {
    async function loadData() {
      try {
        setLoadError('');

        const [projectsResponse, taskTypesResponse] = await Promise.all([
          fetch('/api/mobile/projects'),
          fetch('/api/mobile/task-types'),
        ]);

        if (!projectsResponse.ok || !taskTypesResponse.ok) {
          throw new Error('Could not load projects and task types.');
        }

        const projectsData = (await projectsResponse.json()) as ProjectResponse;
        const taskTypesData = (await taskTypesResponse.json()) as TaskTypeResponse;

        setProjects(projectsData.projects.map((project) => ({ id: project.id, label: project.name })));
        setTaskTypes(taskTypesData.taskTypes.map((taskType) => ({ id: taskType.id, label: taskType.name })));
      } catch (error) {
        console.error('Failed to load projects/taskTypes:', error);
        setLoadError(error instanceof Error ? error.message : 'Could not load projects and task types.');
      } finally {
        setLoading(false);
      }
    }

    void Promise.resolve().then(loadData);
  }, []);

  if (loading) {
    return <div className="text-slate-300">Loading...</div>;
  }

  const currentView = taskViews.find((view) => view.id === taskView) ?? taskViews[0];

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Tasks"
        title="Manage your tasks"
        description="Create tasks by name and type, track their progress, and start timers directly from here."
      />
      <PreviewHint title="Review mode">
        Тази страница показва как се управляват задачите: timer за текуща работа, списък със статуси и форма за нова задача.
      </PreviewHint>

      <Panel className="p-6">
        <Suspense fallback={<div className="text-slate-300">Loading timer...</div>}>
          <DashboardTimer projects={[]} taskTypes={[]} />
        </Suspense>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel className="p-6">
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <SectionHeading eyebrow="Task view" title={currentView.title} description={currentView.description} />
            <PreviewHint compact className="xl:max-w-sm">
              Табовете филтрират задачите по статус: активни, паузирани или споделени от друг потребител.
            </PreviewHint>
            <div className="flex rounded-2xl border border-white/10 bg-slate-950/60 p-1">
              {taskViews.map((view) => (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => setTaskView(view.id)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    taskView === view.id
                      ? 'bg-cyan-300 text-slate-950'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {view.label}
                </button>
              ))}
            </div>
          </div>

          {taskView === 'active' ? <JobsList refreshToken={refreshToken} initialStatus="active" lockStatus ownOnly /> : null}
          {taskView === 'paused' ? <JobsList refreshToken={refreshToken} initialStatus="paused" lockStatus ownOnly /> : null}
          {taskView === 'shared' ? <JobsList refreshToken={refreshToken} initialStatus="all" lockStatus sharedOnly readOnlyStatus /> : null}
        </Panel>

        <Panel className="p-6">
          {loadError ? <p className="mb-4 text-sm text-rose-400">{loadError}</p> : null}
          <NewJobForm
            projects={projects}
            taskTypes={taskTypes}
            onJobCreated={() => {
              setRefreshToken((value) => value + 1);
              setTaskView('active');
            }}
          />
        </Panel>
      </div>
    </div>
  );
}
