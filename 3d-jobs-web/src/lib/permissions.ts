import { and, eq } from 'drizzle-orm';
import { taskVisibilityPermissions } from '@3d-jobs/db/src/schema';
import { getDb } from './db';

export async function getUserAccessibleTaskIds(userId: string): Promise<string[]> {
  const db = getDb();

  const allowedPermissions = await db
    .select({ subjectId: taskVisibilityPermissions.subjectId })
    .from(taskVisibilityPermissions)
    .where(eq(taskVisibilityPermissions.viewerId, userId));

  return [userId, ...allowedPermissions.map((p) => p.subjectId)];
}

export async function grantPermission(
  grantorId: string,
  viewerId: string,
  subjectId: string
) {
  if (viewerId === subjectId) {
    throw new Error('A user cannot view their own tasks');
  }

  const db = getDb();

  const [existing] = await db
    .select({ id: taskVisibilityPermissions.id })
    .from(taskVisibilityPermissions)
    .where(and(
      eq(taskVisibilityPermissions.viewerId, viewerId),
      eq(taskVisibilityPermissions.subjectId, subjectId)
    ))
    .limit(1);

  if (existing) {
    throw new Error('Permission already exists');
  }

  const [permission] = await db
    .insert(taskVisibilityPermissions)
    .values({ grantorId, viewerId, subjectId })
    .returning();

  return permission;
}

export async function revokePermission(permissionId: string) {
  const db = getDb();

  const result = await db
    .delete(taskVisibilityPermissions)
    .where(eq(taskVisibilityPermissions.id, permissionId));

  return result.rowCount ?? 0;
}

export async function listPermissions(viewerId?: string, subjectId?: string) {
  const db = getDb();
  const conditions = [];

  if (viewerId) {
    conditions.push(eq(taskVisibilityPermissions.viewerId, viewerId));
  }

  if (subjectId) {
    conditions.push(eq(taskVisibilityPermissions.subjectId, subjectId));
  }

  const query = db
    .select({
      id: taskVisibilityPermissions.id,
      grantorId: taskVisibilityPermissions.grantorId,
      viewerId: taskVisibilityPermissions.viewerId,
      subjectId: taskVisibilityPermissions.subjectId,
      createdAt: taskVisibilityPermissions.createdAt,
    })
    .from(taskVisibilityPermissions);

  if (conditions.length > 0) {
    return query
      .where(and(...conditions))
      .orderBy(taskVisibilityPermissions.createdAt);
  }

  return query.orderBy(taskVisibilityPermissions.createdAt);
}
