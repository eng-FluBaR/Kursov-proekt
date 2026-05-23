'use client';

import { Suspense, useEffect, useState } from 'react';
import { Panel, SectionHeading } from '@/components/workspace-ui';
import { NewJobForm } from '@/components/new-job-form';
import { JobsList } from '@/components/jobs-list';
import { DashboardTimer } from '@/components/dashboard-timer';

type ProjectResponse = {
  projects: Array<{ id: string; name: string }>;
};

type TaskTypeResponse = {
  taskTypes: Array<{ id: string; name: string }>;
};

export default function JobsPage() {
  const [projects, setProjects] = useState<Array<{ id: string; label: string }>>([]);
  const [taskTypes, setTaskTypes] = useState<Array<{ id: string; label: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);

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

    loadData();
  }, []);

  if (loading) {
    return <div className="text-slate-300">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Tasks"
        title="Manage your tasks"
        description="Create tasks by name and type, track their progress, and start timers directly from here."
      />

      <Panel className="p-6">
        <Suspense fallback={<div className="text-slate-300">Loading timer...</div>}>
          <DashboardTimer projects={[]} taskTypes={[]} />
        </Suspense>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel className="p-6">
          <SectionHeading
            eyebrow="Active tasks"
            title="Your task list"
            description="View and manage the tasks that are ready to work on now."
          />
          <JobsList refreshToken={refreshToken} initialStatus="active" lockStatus ownOnly />
        </Panel>

        <Panel className="p-6">
          {loadError ? <p className="mb-4 text-sm text-rose-400">{loadError}</p> : null}
          <NewJobForm
            projects={projects}
            taskTypes={taskTypes}
            onJobCreated={() => setRefreshToken((value) => value + 1)}
          />
        </Panel>
      </div>

      <Panel className="p-6">
        <SectionHeading
          eyebrow="Paused"
          title="Paused tasks"
          description="Paused tasks stay here so the main task list remains clean."
        />
        <JobsList refreshToken={refreshToken} initialStatus="paused" lockStatus ownOnly />
      </Panel>

      <Panel className="p-6">
        <SectionHeading
          eyebrow="Shared"
          title="Shared tasks"
          description="Tasks shared with you by other users are shown separately from your own task list."
        />
        <JobsList refreshToken={refreshToken} initialStatus="all" lockStatus sharedOnly readOnlyStatus />
      </Panel>
    </div>
  );
}
