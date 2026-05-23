import { and, eq, inArray, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { jobs, projects, taskTypes, users } from '@3d-jobs/db/src/schema';
import { getRequestAuthUser } from '@/lib/auth-session';
import { getDb } from '@/lib/db';
import { getUserAccessibleTaskIds } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

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

  const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
  const taskTypeId = typeof body.taskTypeId === 'string' ? body.taskTypeId.trim() : '';
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';

  // Дебъг лог за проверка на данните преди запис
  console.log('Attempting to create job:', {
    userId: authUser.id,
    projectId,
    taskTypeId,
  });

  if (!projectId || !title) {
    return NextResponse.json(
      { error: 'projectId and title are required' },
      { status: 400 }
    );
  }

  try {
    const db = getDb();
    
    // Проверка дали потребителят съществува в базата данни (Foreign Key check)
    const [userExists] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);
    if (!userExists) {
      return NextResponse.json(
        { error: 'User session is invalid. Please logout and login again.' },
        { status: 401 }
      );
    }

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

    if (!newJob) {
      throw new Error('Database accepted the insert but returned no data.');
    }

    const [jobWithDetails] = await db
      .select({
        id: jobs.id,
        projectId: jobs.projectId,
        projectName: projects.name, // Увери се, че проектите съществуват
        taskTypeId: jobs.taskTypeId,
        taskTypeName: taskTypes.name, // Увери се, че типовете задачи съществуват
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
  } catch (error) {
    // Логваме пълната грешка в конзолата на сървъра
    console.error('DATABASE INSERT ERROR:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to create job';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const authUser = getRequestAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'active';
    const projectId = url.searchParams.get('projectId');

    const db = getDb();

    // Build conditions array
    const conditions = [];
    let userIdsToFilter: string[] = [];

    // Determine which user IDs to filter by based on role and potential query params
    if (authUser.role === 'admin') {
      // Admins can see all tasks by default, or filter by a specific user if 'userId' param is provided
      const adminTargetUserId = url.searchParams.get('userId');
      if (adminTargetUserId) {
        userIdsToFilter.push(adminTargetUserId);
      }
      // If no adminTargetUserId, no userId filter is added, meaning admin sees all
    } else {
      // Regular users see their own tasks and tasks from users who have shared with them
      const sharedUserIds = await getUserAccessibleTaskIds(authUser.id).catch((err) => {
        console.error(`Error fetching accessible task IDs for user ${authUser.id}:`, err);
        return []; // Return empty array on error to prevent breaking the query
      });
      userIdsToFilter = Array.from(new Set([authUser.id, ...sharedUserIds])).filter(Boolean) as string[];
    }

    // Apply userId filter if there are specific user IDs to filter by
    if (userIdsToFilter.length > 0) {
      conditions.push(inArray(jobs.userId, userIdsToFilter));
    } else if (authUser.role !== 'admin') {
      // If not an admin and no user IDs to filter by, it means no tasks are accessible.
      // This can happen if authUser.id is invalid or getUserAccessibleTaskIds returns nothing.
      console.warn(`No accessible user IDs found for user ${authUser.id}. Returning empty job list.`);
      return NextResponse.json({ jobs: [] });
    }

    if (status) {
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
        createdAt: jobs.createdAt,
      })
      .from(jobs)
      .leftJoin(projects, eq(jobs.projectId, projects.id))
      .leftJoin(taskTypes, eq(jobs.taskTypeId, taskTypes.id))
      .where(and(...conditions))
      .orderBy(desc(jobs.createdAt));

    console.log(`Fetched ${jobsList.length} jobs for user ${authUser.id} (role: ${authUser.role}, status: ${status}, projectId: ${projectId || 'any'}).`);
    return NextResponse.json({ jobs: jobsList });
  } catch (error) {
    console.error('CRITICAL BE ERROR:', error);
    return NextResponse.json(
      { 
        error: 'Бекендът се счупи!', 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }, 
      { status: 500 }
    );
  }
}
