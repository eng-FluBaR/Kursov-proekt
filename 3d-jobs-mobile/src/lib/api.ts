import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getDefaultApiBaseUrl() {
  if (Platform.OS === 'web') {
    return 'http://localhost:3001';
  }

  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
  const host = hostUri?.split(':')[0];

  if (host) {
    return `http://${host}:3001`;
  }

  return Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001';
}

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  getDefaultApiBaseUrl();

export type AuthUser = {
  id: string;
  email: string;
  role: 'admin' | 'user';
};

export type Project = {
  id: string;
  name: string;
  color: string;
  description: string | null;
  archived: boolean;
};

export type TaskType = {
  id: string;
  name: string;
  icon: string | null;
};

export type TimeEntry = {
  id: string;
  projectId: string;
  projectName: string;
  projectColor: string;
  jobId?: string | null;
  jobTitle?: string | null;
  taskTypeId: string | null;
  taskTypeName: string | null;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
  note: string | null;
};

export type Job = {
  id: string;
  projectId: string;
  projectName: string;
  taskTypeId: string | null;
  taskTypeName: string | null;
  title: string;
  description: string | null;
  status: 'active' | 'paused' | 'completed' | string;
  userId?: string;
  ownerEmail?: string | null;
  isShared?: boolean;
  totalDurationMinutes?: number;
  createdAt: string;
};

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  token?: string | null;
  body?: unknown;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new ApiError(data.error ?? 'Request failed.', response.status);
  }

  return data;
}

export function formatDuration(minutes: number | null) {
  if (minutes === null) {
    return 'Running';
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  }

  return `${hours}h ${mins}m`;
}
