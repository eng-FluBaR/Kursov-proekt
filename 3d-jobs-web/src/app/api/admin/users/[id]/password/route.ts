import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { users } from '@3d-jobs/db/src/schema';
import { requireAdmin } from '@/lib/admin';
import { getDb } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = requireAdmin(request);
  if (response) {
    return response;
  }

  const { id } = await params;
  let body: { password?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const password = typeof body.password === 'string' ? body.password : '';
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
  }

  const db = getDb();
  const [updatedUser] = await db
    .update(users)
    .set({ passwordHash: await bcrypt.hash(password, 10) })
    .where(eq(users.id, id))
    .returning({ id: users.id, email: users.email });

  if (!updatedUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user: updatedUser });
}
