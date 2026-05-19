import { asc } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { taskTypes } from '@3d-jobs/db/src/schema';
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
      id: taskTypes.id,
      name: taskTypes.name,
      icon: taskTypes.icon,
    })
    .from(taskTypes)
    .orderBy(asc(taskTypes.name));

  return NextResponse.json({ taskTypes: rows });
}
