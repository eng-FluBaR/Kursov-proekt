import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { users } from '@3d-jobs/db/src/schema';
import { getRequestAuthUser } from '@/lib/auth-session';
import { getDb } from '@/lib/db';
import { 
  grantPermission, 
  revokePermission, 
  listPermissions 
} from '@/lib/permissions';

export async function POST(request: Request) {
  const authUser = getRequestAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (authUser.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden - only admins can manage permissions' }, { status: 403 });
  }

  let body: { viewerId?: unknown; subjectId?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const viewerId = typeof body.viewerId === 'string' ? body.viewerId : '';
  const subjectId = typeof body.subjectId === 'string' ? body.subjectId : '';

  if (!viewerId || !subjectId) {
    return NextResponse.json(
      { error: 'viewerId and subjectId are required' },
      { status: 400 }
    );
  }

  try {
    const db = getDb();

    const [viewer, subject] = await Promise.all([
      db.select({ id: users.id }).from(users).where(eq(users.id, viewerId)).limit(1),
      db.select({ id: users.id }).from(users).where(eq(users.id, subjectId)).limit(1),
    ]);

    if (!viewer[0] || !subject[0]) {
      return NextResponse.json({ error: 'One or both users not found' }, { status: 404 });
    }

    const permission = await grantPermission(authUser.id, viewerId, subjectId);

    return NextResponse.json({ permission }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to grant permission';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const authUser = getRequestAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (authUser.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const viewerId = url.searchParams.get('viewerId') || undefined;
    const subjectId = url.searchParams.get('subjectId') || undefined;

    const permissions = await listPermissions(viewerId, subjectId);

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error('Failed to fetch permissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const authUser = getRequestAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (authUser.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { permissionId?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const permissionId = typeof body.permissionId === 'string' ? body.permissionId : '';

  if (!permissionId) {
    return NextResponse.json({ error: 'Permission ID is required' }, { status: 400 });
  }

  try {
    const rowCount = await revokePermission(permissionId);

    if (rowCount === 0) {
      return NextResponse.json({ error: 'Permission not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to revoke permission:', error);
    const message = error instanceof Error ? error.message : 'Failed to revoke permission';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
