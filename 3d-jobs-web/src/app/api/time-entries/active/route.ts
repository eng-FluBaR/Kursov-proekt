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
    
    const [entry] = await db
      .select({
        id: timeEntries.id,
        projectId: timeEntries.projectId,
        projectName: projects.name,
        taskTypeId: timeEntries.taskTypeId,
        taskTypeName: taskTypes.name,
        startedAt: timeEntries.startedAt,
        durationMinutes: timeEntries.durationMinutes,
        note: timeEntries.note,
      })
      .from(timeEntries)
      .innerJoin(projects, eq(timeEntries.projectId, projects.id))
      .leftJoin(taskTypes, eq(timeEntries.taskTypeId, taskTypes.id))
      .where(
        and(
          eq(timeEntries.userId, authUser.id),
          isNull(timeEntries.endedAt)
        )
      )
      .limit(1);

    if (!entry) {
      return NextResponse.json({ entry: null });
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error('Failed to fetch active timer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active timer' },
      { status: 500 }
    );
  }
}
