import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { timeEntries, projects, taskTypes } from '@3d-jobs/db/src/schema';
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
    note?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const projectId = typeof body.projectId === 'string' ? body.projectId : '';
  const jobId = typeof body.jobId === 'string' ? body.jobId : '';
  const taskTypeId = typeof body.taskTypeId === 'string' ? body.taskTypeId : '';
  const startedAt = typeof body.startedAt === 'string' ? body.startedAt : '';
  const note = typeof body.note === 'string' ? body.note : '';

  if (!projectId || !startedAt) {
    return NextResponse.json(
      { error: 'projectId and startedAt are required' },
      { status: 400 }
    );
  }

  try {
    const db = getDb();
    
    // If there's an active timer (no endedAt), stop it first
    const [activeEntry] = await db
      .select()
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.userId, authUser.id),
          eq(timeEntries.endedAt, null)
        )
      )
      .limit(1);

    if (activeEntry) {
      const now = new Date();
      const durationMs = now.getTime() - new Date(activeEntry.startedAt).getTime();
      const durationMinutes = Math.round(durationMs / 60000);
      
      await db
        .update(timeEntries)
        .set({
          endedAt: now,
          durationMinutes,
        })
        .where(eq(timeEntries.id, activeEntry.id));
    }

    const startDate = new Date(startedAt);
    const endDate = body.endedAt ? new Date(body.endedAt as string) : null;
    
    let durationMinutes: number | null = null;
    if (endDate) {
      const durationMs = endDate.getTime() - startDate.getTime();
      durationMinutes = Math.round(durationMs / 60000);
    }

    const [newEntry] = await db
      .insert(timeEntries)
      .values({
        userId: authUser.id,
        projectId,
        jobId: jobId || null,
        taskTypeId: taskTypeId || null,
        startedAt: startDate,
        endedAt: endDate,
        durationMinutes,
        note: note || null,
      })
      .returning();

    if (!newEntry || !newEntry.id) {
      return NextResponse.json(
        { error: 'Failed to create time entry - no ID returned' },
        { status: 500 }
      );
    }

    // Fetch project name
    const [project] = await db
      .select({ name: projects.name })
      .from(projects)
      .where(eq(projects.id, projectId));

    // Get task type name if exists
    let taskTypeName = null;
    if (newEntry.taskTypeId) {
      const [taskType] = await db
        .select({ name: taskTypes.name })
        .from(taskTypes)
        .where(eq(taskTypes.id, newEntry.taskTypeId));
      taskTypeName = taskType?.name || null;
    }

    const entry = {
      id: newEntry.id,
      projectId: projectId,
      projectName: project?.name || 'Unknown Project',
      jobId: newEntry.jobId || null,
      taskTypeId: newEntry.taskTypeId || null,
      taskTypeName: taskTypeName,
      startedAt: newEntry.startedAt instanceof Date ? newEntry.startedAt.toISOString() : String(newEntry.startedAt),
      endedAt: newEntry.endedAt ? (newEntry.endedAt instanceof Date ? newEntry.endedAt.toISOString() : String(newEntry.endedAt)) : null,
      durationMinutes: newEntry.durationMinutes,
      note: newEntry.note,
    };

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error('Failed to create time entry - exception:', error);
    console.error('Error type:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create time entry' },
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
    const fromDate = url.searchParams.get('from');
    const toDate = url.searchParams.get('to');
    const projectId = url.searchParams.get('projectId');
    const taskTypeId = url.searchParams.get('taskTypeId');

    const db = getDb();
    let query = db
      .select({
        id: timeEntries.id,
        projectId: timeEntries.projectId,
        projectName: projects.name,
        jobId: timeEntries.jobId,
        taskTypeId: timeEntries.taskTypeId,
        taskTypeName: taskTypes.name,
        startedAt: timeEntries.startedAt,
        endedAt: timeEntries.endedAt,
        durationMinutes: timeEntries.durationMinutes,
        note: timeEntries.note,
        createdAt: timeEntries.createdAt,
      })
      .from(timeEntries)
      .innerJoin(projects, eq(timeEntries.projectId, projects.id))
      .leftJoin(taskTypes, eq(timeEntries.taskTypeId, taskTypes.id))
      .where(eq(timeEntries.userId, authUser.id));

    // Apply filters
    const conditions = [eq(timeEntries.userId, authUser.id)];

    if (fromDate) {
      conditions.push(eq(timeEntries.startedAt, new Date(fromDate)));
    }
    if (projectId) {
      conditions.push(eq(timeEntries.projectId, projectId));
    }

    const entries = await query.orderBy(timeEntries.startedAt).limit(100);

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Failed to fetch time entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time entries' },
      { status: 500 }
    );
  }
}
