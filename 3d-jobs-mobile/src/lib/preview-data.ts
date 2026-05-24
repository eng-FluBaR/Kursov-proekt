import type { Job, Project, TaskType, TimeEntry } from './api';

export const previewProjects: Project[] = [
  { id: 'preview-project-1', name: 'Prototype Lab', color: '#14b8a6', description: 'Sample production jobs.', archived: false },
  { id: 'preview-project-2', name: 'Client Review Queue', color: '#f97316', description: 'Design review and approvals.', archived: false },
];

export const previewTaskTypes: TaskType[] = [
  { id: 'preview-type-1', name: 'Modeling', icon: null },
  { id: 'preview-type-2', name: 'Print setup', icon: null },
  { id: 'preview-type-3', name: 'Review', icon: null },
];

export const previewJobs: Job[] = [
  {
    id: 'preview-job-1',
    projectId: previewProjects[0].id,
    projectName: previewProjects[0].name,
    taskTypeId: previewTaskTypes[0].id,
    taskTypeName: previewTaskTypes[0].name,
    title: 'Drone shell prototype',
    description: 'Prepare model revisions, print settings, and first quality notes.',
    status: 'active',
    createdAt: new Date().toISOString(),
    totalDurationMinutes: 135,
  },
  {
    id: 'preview-job-2',
    projectId: previewProjects[0].id,
    projectName: previewProjects[0].name,
    taskTypeId: previewTaskTypes[1].id,
    taskTypeName: previewTaskTypes[1].name,
    title: 'Resin calibration pass',
    description: 'Check exposure tests and document final settings.',
    status: 'paused',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    totalDurationMinutes: 70,
  },
  {
    id: 'preview-job-3',
    projectId: previewProjects[1].id,
    projectName: previewProjects[1].name,
    taskTypeId: previewTaskTypes[2].id,
    taskTypeName: previewTaskTypes[2].name,
    title: 'Client approval notes',
    description: 'Collect feedback and export summary for the team.',
    status: 'completed',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    totalDurationMinutes: 95,
  },
];

export const previewTimeEntries: TimeEntry[] = [
  {
    id: 'preview-entry-1',
    projectId: previewProjects[0].id,
    projectName: previewProjects[0].name,
    projectColor: previewProjects[0].color,
    jobId: previewJobs[0].id,
    jobTitle: previewJobs[0].title,
    taskTypeId: previewTaskTypes[0].id,
    taskTypeName: previewTaskTypes[0].name,
    startedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    endedAt: new Date(Date.now() - 45 * 60000).toISOString(),
    durationMinutes: 135,
    note: 'Preview session for modeling work.',
  },
  {
    id: 'preview-entry-2',
    projectId: previewProjects[1].id,
    projectName: previewProjects[1].name,
    projectColor: previewProjects[1].color,
    jobId: previewJobs[2].id,
    jobTitle: previewJobs[2].title,
    taskTypeId: previewTaskTypes[2].id,
    taskTypeName: previewTaskTypes[2].name,
    startedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    endedAt: new Date(Date.now() - 2 * 86400000 + 95 * 60000).toISOString(),
    durationMinutes: 95,
    note: 'Example completed review entry.',
  },
];
