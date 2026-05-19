'use client';

import React from 'react';
import { Entry, Project } from '@/mockData';

export function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-12 bg-gray-300 rounded"></div>
      <div className="h-12 bg-gray-300 rounded"></div>
      <div className="h-12 bg-gray-300 rounded"></div>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-xl font-semibold text-gray-700">{title}</p>
      <p className="text-gray-500">{description}</p>
    </div>
  );
}

interface ProjectSelectProps {
  projects: Project[];
  value: string;
  onChange: (projectId: string) => void;
}

export function ProjectSelect({ projects, value, onChange }: ProjectSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="font-semibold">Project:</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded"
      >
        <option value="">Select a project</option>
        {projects.map(p => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}

interface TaskTypeSelectProps {
  value: string;
  onChange: (type: string) => void;
}

export function TaskTypeSelect({ value, onChange }: TaskTypeSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="font-semibold">Task Type:</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded"
      >
        <option value="">Select type</option>
        <option value="Design">Design</option>
        <option value="Development">Development</option>
        <option value="Testing">Testing</option>
        <option value="Documentation">Documentation</option>
        <option value="Meeting">Meeting</option>
      </select>
    </div>
  );
}

interface TimerWidgetProps {
  isRunning: boolean;
  elapsed: number;
  onStart: () => void;
  onStop: () => void;
  selectedProject: string;
  onProjectChange: (projectId: string) => void;
  projects: Project[];
}

export function TimerWidget({
  isRunning,
  elapsed,
  onStart,
  onStop,
  selectedProject,
  onProjectChange,
  projects,
}: TimerWidgetProps) {
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-blue-500">
      <h2 className="text-2xl font-bold mb-4">Active Timer</h2>
      <div className="text-5xl font-mono font-bold text-blue-600 mb-6">
        {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:
        {String(seconds).padStart(2, '0')}
      </div>
      <div className="mb-4">
        <ProjectSelect projects={projects} value={selectedProject} onChange={onProjectChange} />
      </div>
      <div className="flex gap-4">
        {!isRunning ? (
          <button onClick={onStart} className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600">
            Start
          </button>
        ) : (
          <button onClick={onStop} className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600">
            Stop
          </button>
        )}
      </div>
    </div>
  );
}

interface EntryListItemProps {
  entry: Entry;
  project: Project | undefined;
}

export function EntryListItem({ entry, project }: EntryListItemProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded border border-gray-200">
      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: project?.color }}></div>
      <div className="flex-1">
        <div className="font-semibold">{project?.name}</div>
        <div className="text-sm text-gray-600">
          {entry.taskType} • {entry.startTime} - {entry.endTime} ({entry.duration}m)
        </div>
        {entry.note && <div className="text-sm text-gray-500 mt-1">{entry.note}</div>}
      </div>
    </div>
  );
}

export function FileUploadInput() {
  return (
    <div>
      <label className="font-semibold mb-2 block">Upload Files (optional)</label>
      <input
        type="file"
        multiple
        accept=".jpg,.png,.webp,.stl,.obj,.3mf,.step"
        className="block w-full px-3 py-2 border border-gray-300 rounded"
      />
      <p className="text-sm text-gray-600 mt-1">Accepted: .jpg .png .webp .stl .obj .3mf .step</p>
    </div>
  );
}

export function StatCard({ label, value, icon }: { label: string; value: string | number; icon?: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
      <p className="text-gray-600 text-sm">{label}</p>
      <p className="text-3xl font-bold mt-2">{icon} {value}</p>
    </div>
  );
}
