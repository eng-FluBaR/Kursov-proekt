import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { jobs } from '@3d-jobs/db/src/schema';
import { getRequestAuthUser } from '@/lib/auth-session';
import { getDb } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authUser = getRequestAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { status?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const status = typeof body.status === 'string' ? body.status : '';

  if (!status) {
    return NextResponse.json({ error: 'status is required' }, { status: 400 });
  }

  const id = params.id;

  try {
    const db = getDb();
    const [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, id))
      .limit(1);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.userId !== authUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const [updatedJob] = await db
      .update(jobs)
      .set({ status })
      .where(eq(jobs.id, id))
      .returning();

    return NextResponse.json({ job: updatedJob });
  } catch (error) {
    console.error('Failed to update job:', error);
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    );
  }
}
