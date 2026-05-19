'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import type { AuthUser } from '@/lib/auth-session';

export function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/auth/me');
        const data = (await response.json()) as { user: AuthUser | null };
        setUser(data.user);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, []);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  if (isLoading) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-end">
        <p className="text-sm font-semibold text-white">{user.email}</p>
        <p className="text-xs text-slate-400 capitalize">{user.role}</p>
      </div>
      <button
        onClick={handleLogout}
        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-rose-500/10 hover:text-rose-100 hover:border-rose-400/20"
      >
        Logout
      </button>
    </div>
  );
}
