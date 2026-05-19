import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { projects, taskTypes, timeEntries } from '@3d-jobs/db/src/schema';
import { getRequestAuthUser } from '@/lib/auth-session';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const user = getRequestAuthUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const db = getDb();
  const rows = await db
    .select({
      id: timeEntries.id,
      projectId: timeEntries.projectId,
      projectName: projects.name,
      projectColor: projects.color,
      taskTypeId: timeEntries.taskTypeId,
      taskTypeName: taskTypes.name,
      startedAt: timeEntries.startedAt,
      endedAt: timeEntries.endedAt,
      durationMinutes: timeEntries.durationMinutes,
      note: timeEntries.note,
    })
    .from(timeEntries)
    .innerJoin(projects, eq(projects.id, timeEntries.projectId))
    .leftJoin(taskTypes, eq(taskTypes.id, timeEntries.taskTypeId))
    .where(eq(timeEntries.userId, user.id))
    .orderBy(desc(timeEntries.startedAt));

  return NextResponse.json({
    timeEntries: rows.map((entry) => ({
      ...entry,
      startedAt: entry.startedAt.toISOString(),
      endedAt: entry.endedAt?.toISOString() ?? null,
    })),
  });
}

export async function POST(request: Request) {
  const user = getRequestAuthUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let body: {
    projectId?: unknown;
    taskTypeId?: unknown;
    startedAt?: unknown;
    endedAt?: unknown;
    durationMinutes?: unknown;
    note?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const projectId = typeof body.projectId === 'string' ? body.projectId : '';
  const taskTypeId = typeof body.taskTypeId === 'string' ? body.taskTypeId : null;
  const startedAt = typeof body.startedAt === 'string' ? new Date(body.startedAt) : null;
  const endedAt = typeof body.endedAt === 'string' ? new Date(body.endedAt) : null;
  const durationMinutes = typeof body.durationMinutes === 'number' ? Math.max(0, Math.round(body.durationMinutes)) : null;
  const note = typeof body.note === 'string' && body.note.trim() ? body.note.trim() : null;

  if (!projectId || !startedAt || Number.isNaN(startedAt.getTime())) {
    return NextResponse.json({ error: 'Project and start time are required.' }, { status: 400 });
  }

  if (endedAt && Number.isNaN(endedAt.getTime())) {
    return NextResponse.json({ error: 'End time is invalid.' }, { status: 400 });
  }

  const db = getDb();
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)))
    .limit(1);

  if (!project) {
    return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
  }

  const [entry] = await db
    .insert(timeEntries)
    .values({
      userId: user.id,
      projectId,
      taskTypeId,
      startedAt,
      endedAt,
      durationMinutes,
      note,
    })
    .returning({ id: timeEntries.id });

  return NextResponse.json({ entry }, { status: 201 });
}
