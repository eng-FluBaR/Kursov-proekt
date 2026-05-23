'use client';

import { useState } from 'react';

type ReportJob = {
  id: string;
  projectName: string;
  taskTypeName: string | null;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
};

type ReportEntry = {
  id: string;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
  note: string | null;
};

type UploadedJobFile = {
  id: string;
  originalName: string;
  fileType: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  uploadedAt: string;
  downloadUrl: string;
};

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

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

function fileNameSafe(value: string) {
  return value.replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'task-report';
}

async function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function JobWordReportButton({
  job,
  notes,
  timeEntries,
  trackedMinutes,
  sessionCount,
}: {
  job: ReportJob;
  notes: string;
  timeEntries: ReportEntry[];
  trackedMinutes: number;
  sessionCount: number;
}) {
  const [isExporting, setIsExporting] = useState(false);

  async function loadFiles() {
    const response = await fetch(`/api/jobs/${job.id}/files`);
    const data = (await response.json()) as { files?: UploadedJobFile[]; error?: string };
    if (!response.ok) {
      throw new Error(data.error ?? 'Could not load files.');
    }
    return data.files ?? [];
  }

  async function loadImageData(file: UploadedJobFile) {
    const response = await fetch(file.downloadUrl);
    if (!response.ok) {
      return null;
    }
    const blob = await response.blob();
    return blobToDataUrl(blob);
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const files = await loadFiles();
      const imageFiles = files.filter((file) => file.fileType === 'image' || file.mimeType?.startsWith('image/'));
      const otherFiles = files.filter((file) => !imageFiles.some((image) => image.id === file.id));
      const imageData = await Promise.all(
        imageFiles.map(async (file) => ({
          file,
          dataUrl: await loadImageData(file),
        })),
      );

      const generatedAt = new Date().toLocaleString();
      const createdAt = new Date(job.createdAt).toLocaleDateString();
      const sessionRows = timeEntries.map((entry, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(new Date(entry.startedAt).toLocaleString())}</td>
          <td>${escapeHtml(entry.endedAt ? new Date(entry.endedAt).toLocaleString() : 'Running / not stopped')}</td>
          <td>${escapeHtml(entry.durationMinutes == null ? '' : formatMinutes(entry.durationMinutes))}</td>
          <td>${escapeHtml(entry.note ?? '')}</td>
        </tr>
      `).join('');

      const imageBlocks = imageData.map(({ file, dataUrl }) => dataUrl ? `
        <div class="image-block">
          <p class="caption">${escapeHtml(file.originalName)} - ${escapeHtml(formatFileSize(file.fileSizeBytes))}</p>
          <img src="${dataUrl}" alt="${escapeHtml(file.originalName)}" />
        </div>
      ` : '').join('');

      const otherFileRows = otherFiles.map((file) => `
        <tr>
          <td>${escapeHtml(file.originalName)}</td>
          <td>${escapeHtml(file.fileType)}</td>
          <td>${escapeHtml(file.mimeType ?? '')}</td>
          <td>${escapeHtml(formatFileSize(file.fileSizeBytes))}</td>
          <td>${escapeHtml(new Date(file.uploadedAt).toLocaleString())}</td>
        </tr>
      `).join('');

      const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(job.title)} report</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; line-height: 1.45; }
    .page { max-width: 900px; margin: 0 auto; }
    .header { border-bottom: 4px solid #0891b2; padding-bottom: 18px; margin-bottom: 24px; }
    .eyebrow { color: #0891b2; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; font-weight: bold; }
    h1 { margin: 8px 0 8px; font-size: 30px; color: #0f172a; }
    h2 { margin-top: 28px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; color: #0f172a; }
    .subtitle { color: #475569; font-size: 14px; }
    .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 22px 0; }
    .card { border: 1px solid #cbd5e1; background: #f8fafc; padding: 12px; border-radius: 8px; }
    .label { color: #64748b; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; font-weight: bold; }
    .value { margin-top: 4px; font-size: 14px; font-weight: bold; color: #0f172a; }
    .notes { white-space: pre-wrap; border: 1px solid #cbd5e1; background: #ffffff; padding: 16px; border-radius: 8px; min-height: 80px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
    th { background: #0f172a; color: #ffffff; text-align: left; }
    th, td { border: 1px solid #cbd5e1; padding: 8px; vertical-align: top; }
    .image-block { margin: 18px 0; page-break-inside: avoid; }
    .image-block img { max-width: 100%; height: auto; border: 1px solid #cbd5e1; border-radius: 8px; }
    .caption { color: #475569; font-size: 12px; font-weight: bold; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #cbd5e1; color: #64748b; font-size: 11px; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="eyebrow">Task report</div>
      <h1>${escapeHtml(job.title)}</h1>
      <div class="subtitle">${escapeHtml(job.projectName)}${job.taskTypeName ? ` - ${escapeHtml(job.taskTypeName)}` : ''}</div>
    </div>

    <div class="summary">
      <div class="card"><div class="label">Status</div><div class="value">${escapeHtml(job.status)}</div></div>
      <div class="card"><div class="label">Created</div><div class="value">${escapeHtml(createdAt)}</div></div>
      <div class="card"><div class="label">Task type</div><div class="value">${escapeHtml(job.taskTypeName ?? 'None')}</div></div>
      <div class="card"><div class="label">Tracked time</div><div class="value">${escapeHtml(formatMinutes(trackedMinutes))}</div></div>
      <div class="card"><div class="label">Sessions</div><div class="value">${escapeHtml(sessionCount)}</div></div>
      <div class="card"><div class="label">Generated</div><div class="value">${escapeHtml(generatedAt)}</div></div>
    </div>

    <h2>Notes</h2>
    <div class="notes">${escapeHtml(notes || job.description || 'No notes recorded.')}</div>

    <h2>Worked Sessions</h2>
    <table>
      <thead><tr><th>#</th><th>Started</th><th>Ended</th><th>Duration</th><th>Note</th></tr></thead>
      <tbody>${sessionRows || '<tr><td colspan="5">No tracked sessions.</td></tr>'}</tbody>
    </table>

    <h2>Images</h2>
    ${imageBlocks || '<p>No image files uploaded.</p>'}

    <h2>Other Uploaded Files</h2>
    <table>
      <thead><tr><th>File name</th><th>Type</th><th>MIME type</th><th>Size</th><th>Uploaded</th></tr></thead>
      <tbody>${otherFileRows || '<tr><td colspan="5">No non-image files uploaded.</td></tr>'}</tbody>
    </table>

    <div class="footer">Generated from 3D Jobs Planner on ${escapeHtml(generatedAt)}</div>
  </div>
</body>
</html>`;

      const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileNameSafe(job.title)}-report.doc`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting}
      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-cyan-300/30 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isExporting ? 'Preparing Word report...' : 'Export Word report'}
    </button>
  );
}
