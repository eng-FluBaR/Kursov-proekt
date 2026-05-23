'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

import type { AuthUser } from '@/lib/auth-session';
import { ProjectDot } from './workspace-ui';
import { UserMenu } from './user-menu';

const desktopNav = [
  { href: '/analytics', label: 'Analytics' },
  { href: '/jobs', label: 'Jobs' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/projects', label: 'Completed tasks' },
  { href: '/admin', label: 'Admin' },
  { href: '/settings', label: 'Settings' },
];

const mobileNav = [
  { href: '/analytics', label: 'Home' },
  { href: '/jobs', label: 'Jobs' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/projects', label: 'Done' },
];

function isActive(pathname: string, href: string) {
  if (href === '/projects') {
    return pathname === '/projects' || pathname.startsWith('/projects/');
  }

  return pathname === href;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') {
      return 'dark';
    }

    return window.localStorage.getItem('tasktimer-theme') === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/auth/me');
        const data = (await response.json()) as { user: AuthUser | null };
        setUser(data.user);
      } catch (error) {
        console.error('Failed to fetch shell user:', error);
      }
    }

    fetchUser();
  }, []);

  useEffect(() => {
    function handleThemeChange(event: Event) {
      const detail = (event as CustomEvent<{ theme?: 'dark' | 'light' }>).detail;
      setTheme(detail?.theme === 'light' ? 'light' : 'dark');
    }

    window.addEventListener('tasktimer-theme-change', handleThemeChange);
    return () => window.removeEventListener('tasktimer-theme-change', handleThemeChange);
  }, []);

  const visibleDesktopNav = useMemo(
    () => desktopNav.filter((item) => item.href !== '/admin' || user?.role === 'admin'),
    [user?.role],
  );
  const showAdminNav = user?.role === 'admin';

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-slate-100' : 'bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.14),_transparent_20%),linear-gradient(180deg,#08111f_0%,#050b16_100%)]'}`}>
      <div className="mx-auto flex min-h-screen max-w-[1640px]">
        <aside className="hidden w-80 flex-col border-r border-white/10 bg-slate-950/55 px-6 py-6 backdrop-blur xl:flex">
          <div className="rounded-[28px] border border-white/10 bg-white/6 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Today</p>
            <p className="mt-3 text-2xl font-semibold text-white">07h 42m</p>
            <p className="mt-2 text-sm text-slate-300">92% of target complete</p>
            <div className="mt-4 h-2 rounded-full bg-white/8">
              <div className="h-full w-[92%] rounded-full bg-gradient-to-r from-cyan-400 to-amber-300" />
            </div>
          </div>

          <nav className="mt-6 space-y-2">
            {visibleDesktopNav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition ${active ? 'bg-cyan-400/15 text-white ring-1 ring-cyan-300/20' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <span>{item.label}</span>
                  {active ? <span className="h-2.5 w-2.5 rounded-full bg-cyan-300" /> : null}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            <ProjectDot color="#34d399" />
            <span>Neon sync ready</span>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 px-4 py-4 backdrop-blur md:px-6 xl:px-8">
            <div className="flex items-center justify-between gap-4">
              <div />
              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-3 md:flex">
                  <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">Workspace: 3D Jops planer</span>
                </div>
                <UserMenu />
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 pb-28 md:px-6 xl:px-8 xl:pb-10">{children}</main>
        </div>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-30 rounded-[1.5rem] border border-white/10 bg-slate-950/88 px-2 py-2 shadow-[0_16px_50px_rgba(0,0,0,0.45)] backdrop-blur md:hidden">
        <div className="grid grid-cols-5 gap-1 text-[11px] font-medium text-slate-300">
          {mobileNav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 transition ${active ? 'bg-cyan-400/15 text-white' : 'hover:bg-white/5 hover:text-white'}`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${active ? 'bg-cyan-300' : 'bg-white/20'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <details className="group relative rounded-2xl">
            <summary className="flex list-none flex-col items-center gap-1 rounded-2xl px-2 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white">
              <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
              <span>More</span>
            </summary>
            <div className="absolute bottom-14 right-0 w-44 rounded-2xl border border-white/10 bg-slate-950 p-2 shadow-xl">
              {showAdminNav ? <Link href="/admin" className="block rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">Admin</Link> : null}
              <Link href="/settings" className="block rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">Settings</Link>
            </div>
          </details>
        </div>
      </nav>
    </div>
  );
}
