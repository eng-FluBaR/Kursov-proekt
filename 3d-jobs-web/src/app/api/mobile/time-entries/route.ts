import { and, desc, eq, inArray, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { jobVisibilityPermissions, jobs, projects, taskTypes, timeEntries, users } from '@3d-jobs/db/src/schema';
import { getRequestAuthUser } from '@/lib/auth-session';
import { getDb } from '@/lib/db';
import { getUserSharedJobIds } from '@/lib/job-permissions';
import { getUserAccessibleTaskIds } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

async function createJob(authUserId: string, body: Record<string, unknown>) {
  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  const taskTypeId = typeof body.taskTypeId === 'string' ? body.taskTypeId.trim() : '';
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';

  if (!projectId || !title) {
    return NextResponse.json({ error: 'projectId and title are required' }, { status: 400 });
  }

  const db = getDb();
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, authUserId)))
    .limit(1);

  if (!project) {
    return NextResponse.json(
      { error: 'Please select one of your own projects before creating a job.' },
      { status: 400 }
    );
  }

  const [newJob] = await db
    .insert(jobs)
    .values({
      userId: authUserId,
      projectId,
      taskTypeId: taskTypeId || null,
      title,
      description: description || null,
      status: 'active',
    })
    .returning();

  const [jobWithDetails] = await db
    .select({
      id: jobs.id,
      projectId: jobs.projectId,
      projectName: projects.name,
      taskTypeId: jobs.taskTypeId,
      taskTypeName: taskTypes.name,
      title: jobs.title,
      description: jobs.description,
      status: jobs.status,
      userId: jobs.userId,
      createdAt: jobs.createdAt,
    })
    .from(jobs)
    .leftJoin(projects, eq(jobs.projectId, projects.id))
    .leftJoin(taskTypes, eq(jobs.taskTypeId, taskTypes.id))
    .where(eq(jobs.id, newJob.id));

  return NextResponse.json({ job: jobWithDetails }, { status: 201 });
}

async function createTimeEntry(authUserId: string, body: Record<string, unknown>) {
  const jobId = typeof body.jobId === 'string' ? body.jobId : '';
  const fallbackProjectId = typeof body.projectId === 'string' ? body.projectId : '';
  const startedAt = typeof body.startedAt === 'string' ? new Date(body.startedAt) : null;
  const endedAt = typeof body.endedAt === 'string' ? new Date(body.endedAt) : null;
  const note = typeof body.note === 'string' ? body.note.trim() : '';

  if (!startedAt || Number.isNaN(startedAt.getTime())) {
    return NextResponse.json({ error: 'startedAt is required' }, { status: 400 });
  }

  const db = getDb();
  let selectedJob: {
    id: string | null;
    userId: string;
    projectId: string;
    projectName: string | null;
    taskTypeId: string | null;
    taskTypeName: string | null;
  } | null = null;

  if (jobId) {
    [selectedJob] = await db
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
  } else if (fallbackProjectId) {
    const [project] = await db
      .select({ id: projects.id, name: projects.name })
      .from(projects)
      .where(and(eq(projects.id, fallbackProjectId), eq(projects.userId, authUserId)))
      .limit(1);
    if (project) {
      selectedJob = {
        id: null,
        userId: authUserId,
        projectId: project.id,
        projectName: project.name,
        taskTypeId: typeof body.taskTypeId === 'string' ? body.taskTypeId : null,
        taskTypeName: null,
      };
    }
  }

  if (!selectedJob) {
    return NextResponse.json({ error: 'Job or project not found' }, { status: 404 });
  }

  if (selectedJob.userId !== authUserId && selectedJob.id) {
    const [permission] = await db
      .select({ id: jobVisibilityPermissions.id })
      .from(jobVisibilityPermissions)
      .where(and(
        eq(jobVisibilityPermissions.viewerId, authUserId),
        eq(jobVisibilityPermissions.jobId, selectedJob.id)
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
      userId: authUserId,
      projectId: selectedJob.projectId,
      jobId: selectedJob.id,
      taskTypeId: selectedJob.taskTypeId,
      startedAt,
      endedAt,
      durationMinutes,
      note: note || null,
    })
    .returning();

  return NextResponse.json({ entry }, { status: 201 });
}

export async function POST(request: Request) {
  const authUser = getRequestAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    if (typeof body.title === 'string') {
      return await createJob(authUser.id, body);
    }

    return await createTimeEntry(authUser.id, body);
  } catch (error) {
    console.error('Mobile time-entries POST failed:', error);
    const message = error instanceof Error ? error.message : 'Request failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const authUser = getRequestAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const projectId = url.searchParams.get('projectId');
  const ownOnly = url.searchParams.get('ownOnly') === 'true';
  const sharedOnly = url.searchParams.get('sharedOnly') === 'true';
  const db = getDb();

  if (status) {
    const conditions = [];
    const sharedJobIds = authUser.role === 'admin' ? [] : await getUserSharedJobIds(authUser.id);

    if (authUser.role === 'admin') {
      const userId = url.searchParams.get('userId');
      if (userId) {
        conditions.push(eq(jobs.userId, userId));
      }
    } else if (sharedOnly) {
      if (sharedJobIds.length === 0) {
        return NextResponse.json({ jobs: [] });
      }
      conditions.push(inArray(jobs.id, sharedJobIds));
    } else if (ownOnly) {
      conditions.push(eq(jobs.userId, authUser.id));
    } else {
      const allowedUserIds = Array.from(new Set([authUser.id, ...(await getUserAccessibleTaskIds(authUser.id))]));
      const visibilityCondition = sharedJobIds.length > 0
        ? or(inArray(jobs.userId, allowedUserIds), inArray(jobs.id, sharedJobIds))
        : inArray(jobs.userId, allowedUserIds);
      conditions.push(visibilityCondition);
    }

    if (status !== 'all') {
      conditions.push(eq(jobs.status, status));
    }

    if (projectId) {
      conditions.push(eq(jobs.projectId, projectId));
    }

    const jobsList = await db
      .select({
        id: jobs.id,
        projectId: jobs.projectId,
        projectName: projects.name,
        taskTypeId: jobs.taskTypeId,
        taskTypeName: taskTypes.name,
        title: jobs.title,
        description: jobs.description,
        status: jobs.status,
        userId: jobs.userId,
        ownerEmail: users.email,
        createdAt: jobs.createdAt,
      })
      .from(jobs)
      .leftJoin(users, eq(users.id, jobs.userId))
      .leftJoin(projects, eq(jobs.projectId, projects.id))
      .leftJoin(taskTypes, eq(jobs.taskTypeId, taskTypes.id))
      .where(and(...conditions))
      .orderBy(desc(jobs.createdAt));

    return NextResponse.json({
      jobs: jobsList.map((job) => ({
        ...job,
        isShared: job.userId !== authUser.id,
      })),
    });
  }

  const entryConditions = [eq(timeEntries.userId, authUser.id)];
  if (projectId) {
    entryConditions.push(eq(timeEntries.projectId, projectId));
  }

  const rows = await db
    .select({
      id: timeEntries.id,
      projectId: timeEntries.projectId,
      projectName: projects.name,
      projectColor: projects.color,
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
    .where(and(...entryConditions))
    .orderBy(desc(timeEntries.startedAt));

  return NextResponse.json({
    timeEntries: rows.map((entry) => ({
      ...entry,
      startedAt: entry.startedAt.toISOString(),
      endedAt: entry.endedAt?.toISOString() ?? null,
    })),
  });
}
