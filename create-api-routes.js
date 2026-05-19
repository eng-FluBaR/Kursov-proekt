const fs = require('fs');
const path = require('path');

// Create logout directory and file
const logoutDir = path.join(__dirname, '3d-jobs-web/src/app/api/auth/logout');
fs.mkdirSync(logoutDir, { recursive: true });
fs.writeFileSync(path.join(logoutDir, 'route.ts'), `import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('tasktimer_user');

  return NextResponse.json({ success: true });
}
`);

// Create me directory and file
const meDir = path.join(__dirname, '3d-jobs-web/src/app/api/auth/me');
fs.mkdirSync(meDir, { recursive: true });
fs.writeFileSync(path.join(meDir, 'route.ts'), `import { NextResponse } from 'next/server';

import { getRequestAuthUser } from '@/lib/auth-session';

export async function GET(request: Request) {
  const authUser = getRequestAuthUser(request);

  if (!authUser) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user: authUser });
}
`);

console.log('API routes created successfully');
