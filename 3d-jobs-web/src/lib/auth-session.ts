import crypto from 'node:crypto';

import { cookies } from 'next/headers';

export type AuthUser = {
  id: string;
  email: string;
  role: 'admin' | 'user';
};

function getAuthSecret() {
  return process.env.AUTH_SECRET ?? process.env.DATABASE_URL ?? 'tasktimer-dev-secret';
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

export function createAuthToken(user: AuthUser) {
  const payload = base64UrlEncode(JSON.stringify(user));
  const signature = crypto.createHmac('sha256', getAuthSecret()).update(payload).digest('base64url');

  return `${payload}.${signature}`;
}

export function verifyAuthToken(token: string): AuthUser | null {
  const [payload, signature] = token.split('.');

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = crypto.createHmac('sha256', getAuthSecret()).update(payload).digest('base64url');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as Partial<AuthUser>;

    if (!parsed.id || !parsed.email || (parsed.role !== 'admin' && parsed.role !== 'user')) {
      return null;
    }

    return {
      id: parsed.id,
      email: parsed.email,
      role: parsed.role,
    };
  } catch {
    return null;
  }
}

export function getRequestAuthUser(request: Request): AuthUser | null {
  const authorization = request.headers.get('authorization');

  if (authorization?.startsWith('Bearer ')) {
    return verifyAuthToken(authorization.slice('Bearer '.length));
  }

  const cookie = request.headers.get('cookie');
  const cookieToken = cookie
    ?.split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith('tasktimer_user='))
    ?.slice('tasktimer_user='.length);

  if (!cookieToken) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(cookieToken)) as Partial<AuthUser>;

    if (!parsed.id || !parsed.email || (parsed.role !== 'admin' && parsed.role !== 'user')) {
      return null;
    }

    return {
      id: parsed.id,
      email: parsed.email,
      role: parsed.role,
    };
  } catch {
    return null;
  }
}

export async function setAuthCookie(user: AuthUser) {
  const cookieStore = await cookies();
  cookieStore.set('tasktimer_user', JSON.stringify(user), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}
