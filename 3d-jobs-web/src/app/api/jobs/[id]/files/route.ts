import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import { NextResponse } from 'next/server';

import { getRequestAuthUser } from '@/lib/auth-session';
import {
  classifyFile,
  ensureCanUploadToJob,
  ensureCanViewJob,
  JOB_UPLOAD_ROOT,
  listJobFiles,
  readJobFileManifest,
  sanitizeFileName,
  writeJobFileManifest,
} from '@/lib/job-files';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getRequestAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const access = await ensureCanViewJob(user, id);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const files = await listJobFiles(id);
  return NextResponse.json({
    files: files.map((file) => ({
      ...file,
      downloadUrl: `/api/jobs/${id}/files/${file.id}/download`,
    })),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = getRequestAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const access = await ensureCanUploadToJob(user, id);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const formData = await request.formData();
  const uploadedFiles = formData.getAll('files').filter((item): item is File => item instanceof File);

  if (uploadedFiles.length === 0) {
    return NextResponse.json({ error: 'Choose at least one file.' }, { status: 400 });
  }

  const existingFiles = await readJobFileManifest(id);
  const savedFiles = [];

  for (const file of uploadedFiles) {
    const fileId = randomUUID();
    const originalName = sanitizeFileName(file.name);
    const storageName = `${fileId}-${originalName}`;
    const storageKey = path.join(id, storageName);
    const destination = path.join(JOB_UPLOAD_ROOT, storageKey);
    const bytes = Buffer.from(await file.arrayBuffer());

    await writeFile(destination, bytes);

    const savedFile = {
      id: fileId,
      jobId: id,
      fileType: classifyFile(originalName, file.type || ''),
      storageKey,
      originalName,
      mimeType: file.type || null,
      fileSizeBytes: bytes.length,
      uploadedAt: new Date().toISOString(),
    };

    savedFiles.push({
      ...savedFile,
      downloadUrl: `/api/jobs/${id}/files/${savedFile.id}/download`,
    });
  }

  await writeJobFileManifest(id, [
    ...existingFiles,
    ...savedFiles.map((file) => ({
      id: file.id,
      jobId: file.jobId,
      fileType: file.fileType,
      storageKey: file.storageKey,
      originalName: file.originalName,
      mimeType: file.mimeType,
      fileSizeBytes: file.fileSizeBytes,
      uploadedAt: file.uploadedAt,
    })),
  ]);

  return NextResponse.json({ files: savedFiles }, { status: 201 });
}
