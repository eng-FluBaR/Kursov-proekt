import { NextResponse } from 'next/server';

import { getRequestAuthUser } from './auth-session';

export function requireAdmin(request: Request) {
  const user = getRequestAuthUser(request);

  if (!user) {
    return { user: null, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  if (user.role !== 'admin') {
    return { user: null, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { user, response: null };
}
