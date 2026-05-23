'use client';

import { useEffect, useState } from 'react';
import { Panel, SectionHeading } from '@/components/workspace-ui';
import { NewJobForm } from '@/components/new-job-form';
import { JobsList } from '@/components/jobs-list';

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

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel className="p-6">
          <SectionHeading
            eyebrow="All tasks"
            title="Your task list"
            description="View and manage all your current tasks."
          />
          <JobsList refreshToken={refreshToken} />
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
    </div>
  );
}
