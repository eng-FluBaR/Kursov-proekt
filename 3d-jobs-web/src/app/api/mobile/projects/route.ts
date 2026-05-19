import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { projects } from '@3d-jobs/db/src/schema';
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
      id: projects.id,
      name: projects.name,
      color: projects.color,
      description: projects.description,
      archived: projects.archived,
    })
    .from(projects)
    .where(eq(projects.userId, user.id));

  return NextResponse.json({ projects: rows });
}
