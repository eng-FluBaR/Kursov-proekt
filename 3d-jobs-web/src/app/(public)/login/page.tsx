import Link from 'next/link';

import { Panel, SectionHeading } from '@/components/workspace-ui';

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-8 md:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel className="p-8">
          <SectionHeading eyebrow="Welcome back" title="Login" description="Use your email and password to enter the workspace." />
          <form className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Email</span>
              <input type="email" placeholder="you@studio.com" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-300/40" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Password</span>
              <input type="password" placeholder="••••••••" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-300/40" />
            </label>
            <button type="submit" className="w-full rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100">Login</button>
            <p className="text-sm text-slate-400">No account yet? <Link href="/register" className="text-cyan-300 hover:text-cyan-200">Register</Link></p>
          </form>
        </Panel>

        <div className="rounded-[2rem] border border-white/10 bg-white/6 p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Mock login</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">Fast access for teams</h2>
          <p className="mt-4 max-w-xl text-slate-300">Use the built-in demo accounts to explore dashboards, analytics, and project views without touching the API.</p>
          <div className="mt-8 space-y-3 text-sm text-slate-200">
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">admin@tasktimer.app / admin123</div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">demo@tasktimer.app / demo123</div>
          </div>
        </div>
      </div>
    </div>
  );
}
