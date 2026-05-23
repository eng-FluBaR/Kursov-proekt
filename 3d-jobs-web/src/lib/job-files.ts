import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { and, eq } from 'drizzle-orm';

import { jobs, jobVisibilityPermissions } from '@3d-jobs/db/src/schema';
import type { AuthUser } from './auth-session';
import { getDb } from './db';

export const JOB_UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads', 'jobs');

export type StoredJobFile = {
  id: string;
  jobId: string;
  fileType: string;
  storageKey: string;
  originalName: string;
  mimeType: string | null;
  fileSizeBytes: number;
  uploadedAt: string;
};

export function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 180) || 'upload.bin';
}

export function classifyFile(fileName: string, mimeType: string) {
  const extension = path.extname(fileName).toLowerCase();

  if (mimeType.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.webp'].includes(extension)) {
    return 'image';
  }

  if (['.stl', '.obj', '.3mf', '.step', '.stp'].includes(extension)) {
    return 'model';
  }

  if (['.pdf', '.doc', '.docx', '.txt'].includes(extension)) {
    return 'document';
  }

  return 'other';
}

export async function ensureCanViewJob(user: AuthUser, jobId: string) {
  const db = getDb();
  const [job] = await db
    .select({ id: jobs.id, userId: jobs.userId })
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1);

  if (!job) {
    return { ok: false as const, status: 404, error: 'Job not found' };
  }

  if (user.role === 'admin' || job.userId === user.id) {
    return { ok: true as const, job };
  }

  try {
    const [permission] = await db
      .select({ id: jobVisibilityPermissions.id })
      .from(jobVisibilityPermissions)
      .where(and(
        eq(jobVisibilityPermissions.viewerId, user.id),
        eq(jobVisibilityPermissions.jobId, jobId),
      ))
      .limit(1);

    if (permission) {
      return { ok: true as const, job };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('job_visibility_permissions')) {
      throw error;
    }
  }

  return { ok: false as const, status: 403, error: 'You cannot view this job.' };
}

export async function ensureCanUploadToJob(user: AuthUser, jobId: string) {
  const access = await ensureCanViewJob(user, jobId);

  if (!access.ok) {
    return access;
  }

  if (user.role !== 'admin' && access.job.userId !== user.id) {
    return { ok: false as const, status: 403, error: 'Only the job owner can upload files.' };
  }

  await mkdir(path.join(JOB_UPLOAD_ROOT, jobId), { recursive: true });

  return access;
}

function getManifestPath(jobId: string) {
  return path.join(JOB_UPLOAD_ROOT, jobId, 'files.json');
}

export async function readJobFileManifest(jobId: string): Promise<StoredJobFile[]> {
  try {
    const contents = await readFile(getManifestPath(jobId), 'utf8');
    const parsed = JSON.parse(contents) as StoredJobFile[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function writeJobFileManifest(jobId: string, files: StoredJobFile[]) {
  await mkdir(path.join(JOB_UPLOAD_ROOT, jobId), { recursive: true });
  await writeFile(getManifestPath(jobId), JSON.stringify(files, null, 2));
}

export async function listJobFiles(jobId: string) {
  return readJobFileManifest(jobId);
}
