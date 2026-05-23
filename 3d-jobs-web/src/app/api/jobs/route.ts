import { and, eq, inArray, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { jobs, projects, taskTypes } from '@3d-jobs/db/src/schema';
import { getRequestAuthUser } from '@/lib/auth-session';
import { getDb } from '@/lib/db';
import { getUserAccessibleTaskIds } from '@/lib/permissions';
import { getUserSharedJobIds } from '@/lib/job-permissions';

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

    // Execute the query
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
        createdAt: jobs.createdAt,
      })
      .from(jobs)
      .leftJoin(projects, eq(jobs.projectId, projects.id))
      .leftJoin(taskTypes, eq(jobs.taskTypeId, taskTypes.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(jobs.createdAt);

    return NextResponse.json({ jobs: jobsList });
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
