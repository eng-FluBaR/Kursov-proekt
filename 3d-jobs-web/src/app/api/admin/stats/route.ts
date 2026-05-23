import { count, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { entryFiles, jobs, projects, taskTypes, timeEntries, users } from '@3d-jobs/db/src/schema';
import { requireAdmin } from '@/lib/admin';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  const { response } = requireAdmin(request);
  if (response) {
    return response;
  }

  const db = getDb();
  const [userRows, projectRows, fileRows, sessionRows, timeByType] = await Promise.all([
    db.select({ total: count(users.id) }).from(users),
    db.select({ total: count(projects.id) }).from(projects),
    db.select({ total: count(entryFiles.id) }).from(entryFiles),
    db.select({ total: count(timeEntries.id) }).from(timeEntries),
    db
      .select({
        userId: users.id,
        userEmail: users.email,
        taskTypeId: taskTypes.id,
        taskTypeName: taskTypes.name,
        minutes: sql<number>`coalesce(sum(${timeEntries.durationMinutes}), 0)`,
        sessions: count(timeEntries.id),
      })
      .from(timeEntries)
      .innerJoin(users, eq(users.id, timeEntries.userId))
      .leftJoin(taskTypes, eq(taskTypes.id, timeEntries.taskTypeId))
      .groupBy(users.id, users.email, taskTypes.id, taskTypes.name)
      .orderBy(users.email, taskTypes.name),
  ]);

  const jobRows = await db.select({ total: count(jobs.id) }).from(jobs);

  return NextResponse.json({
    totals: {
      users: userRows[0]?.total ?? 0,
      projects: projectRows[0]?.total ?? 0,
      jobs: jobRows[0]?.total ?? 0,
      files: fileRows[0]?.total ?? 0,
      sessions: sessionRows[0]?.total ?? 0,
    },
    timeByType,
  });
}
