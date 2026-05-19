import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { users } from '@3d-jobs/db/src/schema';
import { setAuthCookie } from '@/lib/auth-session';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  if (!email.includes('@')) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
  }

  try {
    const db = getDb();
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    const [user] = await db
      .insert(users)
      .values({
        email,
        passwordHash: await bcrypt.hash(password, 10),
        role: 'user',
      })
      .returning({
        id: users.id,
        email: users.email,
        role: users.role,
      });

    await setAuthCookie(user);

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown register error.';

    if (message.includes('DATABASE_URL')) {
      return NextResponse.json(
        { error: 'Database connection is not configured. Add DATABASE_URL to the root .env file.' },
        { status: 500 },
      );
    }

    console.error('Register failed:', error);
    return NextResponse.json({ error: 'Could not save the account to the database.' }, { status: 500 });
  }
}
