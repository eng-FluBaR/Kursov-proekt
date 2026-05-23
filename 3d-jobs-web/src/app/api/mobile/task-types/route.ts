import { NextResponse } from 'next/server';

import { taskTypes } from '@3d-jobs/db/src/schema';
import { getRequestAuthUser } from '@/lib/auth-session';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

const CORE_TASK_TYPES = [
  { name: '3D Modelling', icon: 'cube' },
  { name: '3D Scanning', icon: 'scan' },
  { name: '3D Printing', icon: 'printer' },
  { name: 'Development', icon: 'code' },
  { name: 'Other', icon: 'circle' },
];

export async function GET(request: Request) {
  const user = getRequestAuthUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const db = getDb();
  const existingRows = await db
    .select({
      id: taskTypes.id,
      name: taskTypes.name,
      icon: taskTypes.icon,
    })
    .from(taskTypes);

  const existingNames = new Set(existingRows.map((row) => row.name));
  const missingTaskTypes = CORE_TASK_TYPES.filter((taskType) => !existingNames.has(taskType.name));

  if (missingTaskTypes.length > 0) {
    await db.insert(taskTypes).values(missingTaskTypes).onConflictDoNothing({ target: taskTypes.name });
  }

  const rows = await db
    .select({
      id: taskTypes.id,
      name: taskTypes.name,
      icon: taskTypes.icon,
    })
    .from(taskTypes);

  const coreOrder = new Map(CORE_TASK_TYPES.map((taskType, index) => [taskType.name, index]));
  const orderedCoreRows = rows
    .filter((row) => coreOrder.has(row.name))
    .sort((left, right) => {
      return (coreOrder.get(left.name) ?? 0) - (coreOrder.get(right.name) ?? 0);
    });

  return NextResponse.json({ taskTypes: orderedCoreRows });
}
