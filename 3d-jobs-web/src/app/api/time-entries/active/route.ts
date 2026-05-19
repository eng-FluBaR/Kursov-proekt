import { and, eq, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { timeEntries, projects, taskTypes } from '@3d-jobs/db/src/schema';
import { getRequestAuthUser } from '@/lib/auth-session';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  const authUser = getRequestAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getDb();
    
    // Get the active entry without JOIN first
    const entries = await db
      .select()
      .from(timeEntries)
      .where(
        and(
          eq(timeEntries.userId, authUser.id),
          isNull(timeEntries.endedAt)
        )
      )
      .limit(1);
    
    if (!entries.length) {
      return NextResponse.json({ entry: null });
    }

    const entry = entries[0];
    
    // Get project name separately
    const [project] = await db
      .select({ name: projects.name })
      .from(projects)
      .where(eq(projects.id, entry.projectId));
    
    // Get task type name if exists
    let taskTypeName = null;
    if (entry.taskTypeId) {
      const [taskType] = await db
        .select({ name: taskTypes.name })
        .from(taskTypes)
        .where(eq(taskTypes.id, entry.taskTypeId));
      taskTypeName = taskType?.name || null;
    }

    const response = {
      id: entry.id,
      projectId: entry.projectId,
      projectName: project?.name || 'Unknown Project',
      jobId: entry.jobId,
      taskTypeId: entry.taskTypeId,
      taskTypeName: taskTypeName,
      startedAt: entry.startedAt instanceof Date ? entry.startedAt.toISOString() : String(entry.startedAt),
      endedAt: entry.endedAt ? (entry.endedAt instanceof Date ? entry.endedAt.toISOString() : String(entry.endedAt)) : null,
      durationMinutes: entry.durationMinutes,
      note: entry.note,
    };

    return NextResponse.json({ entry: response });
  } catch (error) {
    console.error('Failed to fetch active timer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active timer' },
      { status: 500 }
    );
  }
}
