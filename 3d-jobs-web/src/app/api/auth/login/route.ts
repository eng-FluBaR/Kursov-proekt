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

  try {
    const db = getDb();
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        role: users.role,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    await setAuthCookie({ id: user.id, email: user.email, role: user.role });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown login error.';

    if (message.includes('DATABASE_URL')) {
      return NextResponse.json(
        { error: 'Database connection is not configured. Add DATABASE_URL to the web app environment.' },
        { status: 500 },
      );
    }

    console.error('Login failed:', error);
    return NextResponse.json({ error: 'Could not connect to the database.' }, { status: 500 });
  }
}
