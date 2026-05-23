import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { users } from '@3d-jobs/db/src/schema';
import { requireAdmin } from '@/lib/admin';
import { getDb } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user: admin, response } = requireAdmin(request);
  if (response) {
    return response;
  }

  const { id } = await params;
  let body: { role?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const role = body.role === 'admin' || body.role === 'user' ? body.role : null;
  if (!role) {
    return NextResponse.json({ error: 'Role must be user or admin' }, { status: 400 });
  }

  if (admin?.id === id && role !== 'admin') {
    return NextResponse.json({ error: 'You cannot remove your own admin role.' }, { status: 400 });
  }

  const db = getDb();
  const [updatedUser] = await db
    .update(users)
    .set({ role })
    .where(eq(users.id, id))
    .returning({ id: users.id, email: users.email, role: users.role });

  if (!updatedUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user: updatedUser });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user: admin, response } = requireAdmin(request);
  if (response) {
    return response;
  }

  const { id } = await params;
  if (admin?.id === id) {
    return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 });
  }

  const db = getDb();
  const [deletedUser] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning({ id: users.id });

  if (!deletedUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
