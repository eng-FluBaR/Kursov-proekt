import { cookies } from 'next/headers';

export type AuthUser = {
  id: string;
  email: string;
  role: 'admin' | 'user';
};

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
