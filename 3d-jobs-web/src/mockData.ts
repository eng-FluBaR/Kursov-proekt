// Mock data for TaskTimer app

export interface Project {
  id: string;
  name: string;
  color: string;
  totalHours: number;
  archived: boolean;
}

export interface Entry {
  id: string;
  projectId: string;
  taskType: 'Design' | 'Development' | 'Testing' | 'Documentation' | 'Meeting';
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  note?: string;
  files?: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Website Redesign',
    color: '#3B82F6',
    totalHours: 42.5,
    archived: false,
  },
  {
    id: '2',
    name: 'Mobile App',
    color: '#10B981',
    totalHours: 67.25,
    archived: false,
  },
  {
    id: '3',
    name: 'API Development',
    color: '#F59E0B',
    totalHours: 89.75,
    archived: false,
  },
  {
    id: '4',
    name: 'Documentation',
    color: '#8B5CF6',
    totalHours: 23.5,
    archived: false,
  },
];

export const MOCK_ENTRIES: Entry[] = [
  {
    id: '1',
    projectId: '1',
    taskType: 'Design',
    date: '2025-05-18',
    startTime: '09:00',
    endTime: '12:30',
    duration: 210,
    note: 'Homepage mockups',
  },
  {
    id: '2',
    projectId: '2',
    taskType: 'Development',
    date: '2025-05-18',
    startTime: '13:00',
    endTime: '17:45',
    duration: 285,
    note: 'Authentication module',
  },
  {
    id: '3',
    projectId: '1',
    taskType: 'Development',
    date: '2025-05-18',
    startTime: '18:00',
    endTime: '19:30',
    duration: 90,
    note: 'CSS refactoring',
  },
  {
    id: '4',
    projectId: '3',
    taskType: 'Testing',
    date: '2025-05-17',
    startTime: '10:00',
    endTime: '11:30',
    duration: 90,
    note: 'API endpoint tests',
  },
  {
    id: '5',
    projectId: '2',
    taskType: 'Documentation',
    date: '2025-05-17',
    startTime: '14:00',
    endTime: '15:45',
    duration: 105,
    note: 'API docs update',
  },
  {
    id: '6',
    projectId: '4',
    taskType: 'Documentation',
    date: '2025-05-16',
    startTime: '09:00',
    endTime: '12:00',
    duration: 180,
    note: 'User guide',
  },
  {
    id: '7',
    projectId: '3',
    taskType: 'Development',
    date: '2025-05-16',
    startTime: '13:00',
    endTime: '16:30',
    duration: 210,
    note: 'Database optimization',
  },
  {
    id: '8',
    projectId: '1',
    taskType: 'Design',
    date: '2025-05-15',
    startTime: '10:00',
    endTime: '13:00',
    duration: 180,
    note: 'UI refinements',
  },
  {
    id: '9',
    projectId: '2',
    taskType: 'Meeting',
    date: '2025-05-15',
    startTime: '15:00',
    endTime: '16:00',
    duration: 60,
    note: 'Sprint planning',
  },
  {
    id: '10',
    projectId: '3',
    taskType: 'Development',
    date: '2025-05-14',
    startTime: '09:00',
    endTime: '12:30',
    duration: 210,
    note: 'Feature implementation',
  },
];

export const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'user',
  },
  {
    id: '4',
    name: 'Alice Williams',
    email: 'alice@example.com',
    role: 'user',
  },
];

export const TASK_TYPES = ['Design', 'Development', 'Testing', 'Documentation', 'Meeting'] as const;

export const TODAY = '2025-05-18';

export function getTodayEntries() {
  return MOCK_ENTRIES.filter(entry => entry.date === TODAY);
}

export function getProjectEntries(projectId: string) {
  return MOCK_ENTRIES.filter(entry => entry.projectId === projectId);
}

export function getProject(projectId: string) {
  return MOCK_PROJECTS.find(p => p.id === projectId);
}

export function getProjectColor(projectId: string) {
  const project = getProject(projectId);
  return project?.color || '#6B7280';
}

export function getTaskTypeBreakdown(projectId: string) {
  const entries = getProjectEntries(projectId);
  const breakdown: Record<string, number> = {};

  TASK_TYPES.forEach(type => {
    breakdown[type] = entries
      .filter(e => e.taskType === type)
      .reduce((sum, e) => sum + e.duration, 0);
  });

  return breakdown;
}

export function getTotalProjectHours(projectId: string) {
  const entries = getProjectEntries(projectId);
  return entries.reduce((sum, e) => sum + e.duration, 0) / 60;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function formatTime(time: string): string {
  return new Date(`2025-01-01T${time}`).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
