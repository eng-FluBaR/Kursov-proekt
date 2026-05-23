import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { timeEntries } from '@3d-jobs/db/src/schema';
import { getRequestAuthUser } from '@/lib/auth-session';
import { getDb } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = getRequestAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  console.log('Stopping timer for entry:', id);

  try {
    const db = getDb();
    const now = new Date();

    const [entry] = await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.id, id))
      .limit(1);

    console.log('Found entry:', entry);

    if (!entry) {
      console.log('Entry not found:', id);
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    if (entry.userId !== authUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const durationMs = now.getTime() - new Date(entry.startedAt).getTime();
    const durationMinutes = Math.round(durationMs / 60000);

    console.log('Updating entry duration:', durationMinutes, 'minutes');

    const [updatedEntry] = await db
      .update(timeEntries)
      .set({
        endedAt: now,
        durationMinutes,
      })
      .where(eq(timeEntries.id, id))
      .returning();

    console.log('Updated entry:', updatedEntry);
    return NextResponse.json({ entry: updatedEntry });
  } catch (error) {
    console.error('Failed to stop timer:', error);
    return NextResponse.json(
      { error: 'Failed to stop timer' },
      { status: 500 }
    );
  }
}
