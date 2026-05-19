import { NextResponse } from 'next/server';

import { getRequestAuthUser } from '@/lib/auth-session';

export async function GET(request: Request) {
  const authUser = getRequestAuthUser(request);

  if (!authUser) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user: authUser });
}
