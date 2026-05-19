import { NextResponse } from 'next/server';

import { getRequestAuthUser } from '@/lib/auth-session';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const user = getRequestAuthUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  return NextResponse.json({ user });
}
