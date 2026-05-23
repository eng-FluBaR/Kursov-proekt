import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { jobVisibilityPermissions, jobs, projects, taskTypes, timeEntries } from '@3d-jobs/db/src/schema';
import { getRequestAuthUser } from '@/lib/auth-session';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  const authUser = getRequestAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    projectId?: unknown;
    jobId?: unknown;
    taskTypeId?: unknown;
    startedAt?: unknown;
    endedAt?: unknown;
    durationMinutes?: unknown;
    note?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const jobId = typeof body.jobId === 'string' ? body.jobId : '';
  const startedAtValue = typeof body.startedAt === 'string' ? body.startedAt : '';
  const startedAt = startedAtValue ? new Date(startedAtValue) : null;
  const endedAt = typeof body.endedAt === 'string' ? new Date(body.endedAt) : null;
  const note = typeof body.note === 'string' ? body.note.trim() : '';

  if (!jobId || !startedAt || Number.isNaN(startedAt.getTime())) {
    return NextResponse.json({ error: 'jobId and startedAt are required' }, { status: 400 });
  }

  if (endedAt && Number.isNaN(endedAt.getTime())) {
    return NextResponse.json({ error: 'endedAt is invalid' }, { status: 400 });
  }

  const db = getDb();
  const [job] = await db
    .select({
      id: jobs.id,
      userId: jobs.userId,
      projectId: jobs.projectId,
      projectName: projects.name,
      taskTypeId: jobs.taskTypeId,
      taskTypeName: taskTypes.name,
    })
    .from(jobs)
    .leftJoin(projects, eq(projects.id, jobs.projectId))
    .leftJoin(taskTypes, eq(taskTypes.id, jobs.taskTypeId))
    .where(eq(jobs.id, jobId))
    .limit(1);

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  if (job.userId !== authUser.id) {
    const [permission] = await db
      .select({ id: jobVisibilityPermissions.id })
      .from(jobVisibilityPermissions)
      .where(and(
        eq(jobVisibilityPermissions.viewerId, authUser.id),
        eq(jobVisibilityPermissions.jobId, jobId)
      ))
      .limit(1);

    if (!permission) {
      return NextResponse.json({ error: 'You cannot track time for this job.' }, { status: 403 });
    }
  }

  const durationMinutes = typeof body.durationMinutes === 'number'
    ? Math.max(0, Math.round(body.durationMinutes))
    : endedAt
      ? Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 60000))
      : null;

  const [entry] = await db
    .insert(timeEntries)
    .values({
      userId: authUser.id,
      projectId: job.projectId,
      jobId: job.id,
      taskTypeId: job.taskTypeId,
      startedAt,
      endedAt,
      durationMinutes,
      note: note || null,
    })
    .returning();

  return NextResponse.json({
    entry: {
      id: entry.id,
      projectId: entry.projectId,
      projectName: job.projectName ?? 'Unknown project',
      jobId: entry.jobId,
      taskTypeId: entry.taskTypeId,
      taskTypeName: job.taskTypeName,
      startedAt: entry.startedAt.toISOString(),
      endedAt: entry.endedAt?.toISOString() ?? null,
      durationMinutes: entry.durationMinutes,
      note: entry.note,
    },
  }, { status: 201 });
}

export async function GET(request: Request) {
  const authUser = getRequestAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    const jobId = url.searchParams.get('jobId');
    const conditions = [eq(timeEntries.userId, authUser.id)];

    if (projectId) {
      conditions.push(eq(timeEntries.projectId, projectId));
    }

    if (jobId) {
      conditions.push(eq(timeEntries.jobId, jobId));
    }

    const db = getDb();
    const entries = await db
      .select({
        id: timeEntries.id,
        projectId: timeEntries.projectId,
        projectName: projects.name,
        jobId: timeEntries.jobId,
        jobTitle: jobs.title,
        taskTypeId: timeEntries.taskTypeId,
        taskTypeName: taskTypes.name,
        startedAt: timeEntries.startedAt,
        endedAt: timeEntries.endedAt,
        durationMinutes: timeEntries.durationMinutes,
        note: timeEntries.note,
      })
      .from(timeEntries)
      .innerJoin(projects, eq(projects.id, timeEntries.projectId))
      .leftJoin(jobs, eq(jobs.id, timeEntries.jobId))
      .leftJoin(taskTypes, eq(taskTypes.id, timeEntries.taskTypeId))
      .where(and(...conditions))
      .orderBy(desc(timeEntries.startedAt))
      .limit(100);

    const timeEntriesList = entries.map((entry) => ({
      ...entry,
      startedAt: entry.startedAt.toISOString(),
      endedAt: entry.endedAt?.toISOString() ?? null,
    }));

    return NextResponse.json({ entries: timeEntriesList, timeEntries: timeEntriesList });
  } catch (error) {
    console.error('Failed to fetch time entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time entries' },
      { status: 500 }
    );
  }
}
