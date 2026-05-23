import { and, eq } from 'drizzle-orm';

import { jobVisibilityPermissions } from '@3d-jobs/db/src/schema';
import { getDb } from './db';

export async function getUserSharedJobIds(userId: string) {
  const db = getDb();
  let rows: Array<{ jobId: string }> = [];

  try {
    rows = await db
      .select({ jobId: jobVisibilityPermissions.jobId })
      .from(jobVisibilityPermissions)
      .where(eq(jobVisibilityPermissions.viewerId, userId));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('job_visibility_permissions')) {
      throw error;
    }
  }

  return rows.map((row) => row.jobId);
}

export async function grantJobPermission(grantorId: string, viewerId: string, jobId: string) {
  const db = getDb();
  const [existing] = await db
    .select({ id: jobVisibilityPermissions.id })
    .from(jobVisibilityPermissions)
    .where(and(
      eq(jobVisibilityPermissions.viewerId, viewerId),
      eq(jobVisibilityPermissions.jobId, jobId)
    ))
    .limit(1);

  if (existing) {
    throw new Error('Permission already exists');
  }

  const [permission] = await db
    .insert(jobVisibilityPermissions)
    .values({ grantorId, viewerId, jobId })
    .returning();

  return permission;
}

export async function revokeJobPermission(permissionId: string) {
  const db = getDb();
  const result = await db
    .delete(jobVisibilityPermissions)
    .where(eq(jobVisibilityPermissions.id, permissionId));

  return result.rowCount ?? 0;
}
