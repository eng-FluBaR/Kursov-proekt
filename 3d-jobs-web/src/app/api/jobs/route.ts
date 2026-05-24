import { and, eq, inArray, or, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { jobs, projects, taskTypes, timeEntries } from '@3d-jobs/db/src/schema';
import { getRequestAuthUser } from '@/lib/auth-session';
import { getDb } from '@/lib/db';
import { getUserAccessibleTaskIds } from '@/lib/permissions';
import { getUserSharedJobIds } from '@/lib/job-permissions';

function parsePagination(url: URL) {
  const rawLimit = Number(url.searchParams.get('limit'));
  const rawOffset = Number(url.searchParams.get('offset'));
  const rawPage = Number(url.searchParams.get('page'));
  const enabled = url.searchParams.has('limit') || url.searchParams.has('offset') || url.searchParams.has('page');
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), 100) : 50;
  const pageOffset = Number.isFinite(rawPage) && rawPage > 1 ? (Math.floor(rawPage) - 1) * limit : 0;
  const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? Math.floor(rawOffset) : pageOffset;

  return { enabled, limit, offset };
}

export async function POST(request: Request) {
  const authUser = getRequestAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    projectId?: unknown;
    taskTypeId?: unknown;
    title?: unknown;
    description?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const projectId = typeof body.projectId === 'string' ? body.projectId : '';
  const taskTypeId = typeof body.taskTypeId === 'string' ? body.taskTypeId : '';
  const title = typeof body.title === 'string' ? body.title : '';
  const description = typeof body.description === 'string' ? body.description : '';

  if (!projectId || !title) {
    return NextResponse.json(
      { error: 'projectId and title are required' },
      { status: 400 }
    );
  }

  try {
    const db = getDb();

    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, authUser.id)))
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
        userId: authUser.id,
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
        createdAt: jobs.createdAt,
      })
      .from(jobs)
      .leftJoin(projects, eq(jobs.projectId, projects.id))
      .leftJoin(taskTypes, eq(jobs.taskTypeId, taskTypes.id))
      .where(eq(jobs.id, newJob.id));

    return NextResponse.json({ job: jobWithDetails }, { status: 201 });
  } catch (error) {
    console.error('Failed to create job:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create job';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const authUser = getRequestAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'active';
    const projectId = url.searchParams.get('projectId');
    const ownOnly = url.searchParams.get('ownOnly') === 'true';
    const pagination = parsePagination(url);

    const db = getDb();
    
    const conditions = [];

    if (ownOnly || authUser.role !== 'admin') {
      const allowedUserIds = ownOnly
        ? [authUser.id]
        : Array.from(new Set([authUser.id, ...(await getUserAccessibleTaskIds(authUser.id))]));
      const sharedJobIds = ownOnly ? [] : await getUserSharedJobIds(authUser.id);

      const visibilityCondition = sharedJobIds.length > 0
        ? or(inArray(jobs.userId, allowedUserIds), inArray(jobs.id, sharedJobIds))
        : inArray(jobs.userId, allowedUserIds);
      conditions.push(visibilityCondition);
    }
    
    if (status && status !== 'all') {
      conditions.push(eq(jobs.status, status));
    }

    if (projectId) {
      conditions.push(eq(jobs.projectId, projectId));
    }

    const jobsQuery = db
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
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(jobs.createdAt)
      .$dynamic();

    const queriedJobs = pagination.enabled
      ? await jobsQuery.limit(pagination.limit + 1).offset(pagination.offset)
      : await jobsQuery;
    const hasMore = pagination.enabled && queriedJobs.length > pagination.limit;
    const jobsList = pagination.enabled ? queriedJobs.slice(0, pagination.limit) : queriedJobs;

    const jobIds = jobsList.map((job) => job.id);
    const durationRows = jobIds.length > 0
      ? await db
          .select({
            jobId: timeEntries.jobId,
            totalDurationMinutes: sql<number>`coalesce(sum(${timeEntries.durationMinutes}), 0)`,
          })
          .from(timeEntries)
          .where(inArray(timeEntries.jobId, jobIds))
          .groupBy(timeEntries.jobId)
      : [];
    const durationByJobId = new Map(
      durationRows
        .filter((row) => row.jobId)
        .map((row) => [row.jobId as string, Number(row.totalDurationMinutes) || 0]),
    );

    return NextResponse.json({
      jobs: jobsList.map((job) => ({
        ...job,
        totalDurationMinutes: durationByJobId.get(job.id) ?? 0,
      })),
      ...(pagination.enabled
        ? {
            pagination: {
              limit: pagination.limit,
              offset: pagination.offset,
              returned: jobsList.length,
              hasMore,
              nextOffset: hasMore ? pagination.offset + pagination.limit : null,
            },
          }
        : {}),
    });
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch jobs';
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      { error: errorMessage, stack: errorStack },
      { status: 500 }
    );
  }
}
