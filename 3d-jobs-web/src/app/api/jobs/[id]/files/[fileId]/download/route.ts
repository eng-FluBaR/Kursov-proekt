import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { NextResponse } from 'next/server';

import { getRequestAuthUser } from '@/lib/auth-session';
import { ensureCanViewJob, JOB_UPLOAD_ROOT, readJobFileManifest } from '@/lib/job-files';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const user = getRequestAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, fileId } = await params;
  const access = await ensureCanViewJob(user, id);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const files = await readJobFileManifest(id);
  const file = files.find((item) => item.id === fileId);

  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const fullPath = path.resolve(JOB_UPLOAD_ROOT, file.storageKey);
  if (!fullPath.startsWith(JOB_UPLOAD_ROOT)) {
    return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
  }

  try {
    const bytes = await readFile(fullPath);
    const encodedName = encodeURIComponent(file.originalName);

    return new Response(bytes, {
      headers: {
        'Content-Type': file.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${file.originalName}"; filename*=UTF-8''${encodedName}`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Stored file is missing' }, { status: 404 });
  }
}
