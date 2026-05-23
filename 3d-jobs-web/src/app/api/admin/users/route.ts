import { count, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { jobs, timeEntries, users } from '@3d-jobs/db/src/schema';
import { requireAdmin } from '@/lib/admin';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  const { response } = requireAdmin(request);
  if (response) {
    return response;
  }

  const db = getDb();
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      jobCount: count(jobs.id),
    })
    .from(users)
    .leftJoin(jobs, eq(jobs.userId, users.id))
    .groupBy(users.id)
    .orderBy(desc(users.createdAt));

  const sessions = await db
    .select({
      userId: timeEntries.userId,
      sessionCount: count(timeEntries.id),
    })
    .from(timeEntries)
    .groupBy(timeEntries.userId);

  return NextResponse.json({
    users: rows.map((user) => ({
      ...user,
      sessionCount: sessions.find((item) => item.userId === user.id)?.sessionCount ?? 0,
    })),
  });
}
