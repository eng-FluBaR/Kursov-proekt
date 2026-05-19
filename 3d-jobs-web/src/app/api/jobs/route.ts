import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { jobs, projects, taskTypes } from '@3d-jobs/db/src/schema';
import { getRequestAuthUser } from '@/lib/auth-session';
import { getDb } from '@/lib/db';

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

    return NextResponse.json({ job: newJob }, { status: 201 });
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

    const db = getDb();
    let query = db
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
      .innerJoin(projects, eq(jobs.projectId, projects.id))
      .leftJoin(taskTypes, eq(jobs.taskTypeId, taskTypes.id))
      .where(eq(jobs.userId, authUser.id));

    if (status) {
      query = query.where(eq(jobs.status, status));
    }

    if (projectId) {
      query = query.where(eq(jobs.projectId, projectId));
    }

    const jobsList = await query.orderBy(jobs.createdAt);

    return NextResponse.json({ jobs: jobsList });
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}
