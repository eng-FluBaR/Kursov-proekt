import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { jobVisibilityPermissions, jobs, projects, taskTypes, users } from '@3d-jobs/db/src/schema';
import { requireAdmin } from '@/lib/admin';
import { getDb } from '@/lib/db';
import { grantJobPermission, revokeJobPermission } from '@/lib/job-permissions';

export async function GET(request: Request) {
  const { response } = requireAdmin(request);
  if (response) {
    return response;
  }

  const db = getDb();
  const [usersList, jobsList, permissions] = await Promise.all([
    db
      .select({ id: users.id, email: users.email, role: users.role })
      .from(users)
      .orderBy(users.email),
    db
      .select({
        id: jobs.id,
        title: jobs.title,
        status: jobs.status,
        ownerId: jobs.userId,
        ownerEmail: users.email,
        projectName: projects.name,
        taskTypeName: taskTypes.name,
      })
      .from(jobs)
      .leftJoin(users, eq(users.id, jobs.userId))
      .leftJoin(projects, eq(projects.id, jobs.projectId))
      .leftJoin(taskTypes, eq(taskTypes.id, jobs.taskTypeId))
      .orderBy(desc(jobs.createdAt)),
    db
      .select({
        id: jobVisibilityPermissions.id,
        viewerId: jobVisibilityPermissions.viewerId,
        jobId: jobVisibilityPermissions.jobId,
        grantorId: jobVisibilityPermissions.grantorId,
        createdAt: jobVisibilityPermissions.createdAt,
      })
      .from(jobVisibilityPermissions)
      .orderBy(desc(jobVisibilityPermissions.createdAt)),
  ]);

  return NextResponse.json({ users: usersList, jobs: jobsList, permissions });
}

export async function POST(request: Request) {
  const { user: admin, response } = requireAdmin(request);
  if (response) {
    return response;
  }

  let body: { viewerId?: unknown; viewerIds?: unknown; jobId?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const viewerIds = Array.isArray(body.viewerIds)
    ? body.viewerIds.filter((value): value is string => typeof value === 'string')
    : typeof body.viewerId === 'string'
      ? [body.viewerId]
      : [];
  const jobId = typeof body.jobId === 'string' ? body.jobId : '';

  if (viewerIds.length === 0 || !jobId) {
    return NextResponse.json({ error: 'viewerIds and jobId are required' }, { status: 400 });
  }

  try {
    const db = getDb();
    const [job] = await db
      .select({ id: jobs.id, userId: jobs.userId })
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const results = [];

    for (const viewerId of Array.from(new Set(viewerIds))) {
      const [viewer] = await db.select({ id: users.id }).from(users).where(eq(users.id, viewerId)).limit(1);

      if (!viewer) {
        results.push({ viewerId, status: 'missing-user' });
        continue;
      }

      if (job.userId === viewerId) {
        results.push({ viewerId, status: 'owner-skipped' });
        continue;
      }

      try {
        const permission = await grantJobPermission(admin!.id, viewerId, jobId);
        results.push({ viewerId, status: 'granted', permission });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to grant permission';
        results.push({ viewerId, status: message === 'Permission already exists' ? 'already-shared' : 'error', error: message });
      }
    }

    const granted = results.filter((result) => result.status === 'granted');
    return NextResponse.json({ results }, { status: granted.length > 0 ? 201 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to grant permission';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { response } = requireAdmin(request);
  if (response) {
    return response;
  }

  let body: { permissionId?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const permissionId = typeof body.permissionId === 'string' ? body.permissionId : '';
  if (!permissionId) {
    return NextResponse.json({ error: 'permissionId is required' }, { status: 400 });
  }

  const rowCount = await revokeJobPermission(permissionId);
  if (rowCount === 0) {
    return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
