// Mock data for TaskTimer Expo app

export interface Project {
  id: string;
  name: string;
  color: string;
}

export interface Entry {
  id: string;
  projectId: string;
  taskType: 'Design' | 'Development' | 'Testing' | 'Documentation' | 'Meeting';
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  note?: string;
}

export const MOCK_PROJECTS: Project[] = [
  { id: '1', name: 'Website Redesign', color: '#3B82F6' },
  { id: '2', name: 'Mobile App', color: '#10B981' },
  { id: '3', name: 'API Development', color: '#F59E0B' },
  { id: '4', name: 'Documentation', color: '#8B5CF6' },
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
    note: 'Auth module',
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
    projectId: '2',
    taskType: 'Meeting',
    date: '2025-05-17',
    startTime: '10:00',
    endTime: '11:00',
    duration: 60,
    note: 'Sprint planning',
  },
];

export const TODAY = '2025-05-18';

export function getTodayEntries() {
  return MOCK_ENTRIES.filter(e => e.date === TODAY);
}

export function getProject(projectId: string) {
  return MOCK_PROJECTS.find(p => p.id === projectId);
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}
