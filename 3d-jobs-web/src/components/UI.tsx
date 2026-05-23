'use client';

import React, { useCallback, useEffect, useState } from 'react';
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

type UploadedJobFile = {
  id: string;
  originalName: string;
  fileType: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  uploadedAt: string;
  downloadUrl: string;
};

function formatFileSize(bytes: number | null) {
  if (!bytes) {
    return 'Unknown size';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function FileUploadInput({ jobId }: { jobId?: string }) {
  const [files, setFiles] = useState<UploadedJobFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');

  const loadFiles = useCallback(async () => {
    if (!jobId) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/files`);
      const data = (await response.json()) as { files?: UploadedJobFile[]; error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? 'Could not load files.');
      }
      setFiles(data.files ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load files.');
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    void Promise.resolve().then(loadFiles);
  }, [loadFiles]);

  async function uploadFiles() {
    if (!jobId || !selectedFiles || selectedFiles.length === 0) {
      setMessage('Choose a file first.');
      return;
    }

    const formData = new FormData();
    Array.from(selectedFiles).forEach((file) => formData.append('files', file));

    setIsUploading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/jobs/${jobId}/files`, {
        method: 'POST',
        body: formData,
      });
      const data = (await response.json()) as { files?: UploadedJobFile[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? 'Upload failed.');
      }

      setSelectedFiles(null);
      setMessage('Upload complete.');
      await loadFiles();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-semibold text-white">Upload files</label>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            key={selectedFiles ? 'selected' : 'empty'}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp,.stl,.obj,.3mf,.step,.stp,.pdf,.txt,.doc,.docx"
            onChange={(event) => setSelectedFiles(event.target.files)}
            className="block w-full rounded-2xl border border-dashed border-white/20 bg-slate-900 px-4 py-3 text-sm text-slate-200 file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-300 file:px-4 file:py-2 file:font-semibold file:text-slate-950"
          />
          <button
            type="button"
            onClick={uploadFiles}
            disabled={isUploading || !selectedFiles || selectedFiles.length === 0}
            className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">Accepted: images, STL/OBJ/3MF/STEP, PDF, DOC, TXT.</p>
      </div>

      {message ? <p className="text-sm text-cyan-100">{message}</p> : null}

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Uploaded files</p>
        {isLoading ? <p className="text-sm text-slate-400">Loading files...</p> : null}
        {!isLoading && files.length === 0 ? <p className="text-sm text-slate-500">No files uploaded yet.</p> : null}
        {files.map((file) => (
          <div key={file.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">{file.originalName}</p>
              <p className="mt-1 text-xs text-slate-400">
                {file.fileType} - {formatFileSize(file.fileSizeBytes)} - {new Date(file.uploadedAt).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href={file.downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
              >
                Open
              </a>
              <a
                href={file.downloadUrl}
                download={file.originalName}
                className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-300/20"
              >
                Download
              </a>
            </div>
          </div>
        ))}
      </div>
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
