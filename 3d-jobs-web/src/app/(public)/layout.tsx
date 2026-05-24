import type { ReactNode } from 'react';
import Link from 'next/link';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_24%),linear-gradient(180deg,#08111f_0%,#050b16_100%)]">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-slate-950/75 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <Link href="/" className="text-sm font-semibold text-white transition hover:text-cyan-200">
            TaskTimer
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/" className="rounded-xl px-3 py-2 font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">
              Home
            </Link>
            <Link href="/login" className="rounded-xl px-3 py-2 font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">
              Login
            </Link>
            <Link href="/register" className="rounded-xl bg-cyan-300 px-3 py-2 font-semibold text-slate-950 transition hover:bg-cyan-200">
              Register
            </Link>
          </nav>
        </div>
      </header>
      <main className="min-h-screen pt-16">{children}</main>
    </div>
  );
}
