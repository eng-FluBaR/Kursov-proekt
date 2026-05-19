import Link from 'next/link';

import { LoginForm } from '@/components/login-form';
import { Panel, SectionHeading } from '@/components/workspace-ui';

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-8 md:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel className="p-8">
          <SectionHeading eyebrow="Welcome back" title="Login" description="Use your email and password to enter the workspace." />
          <LoginForm />
          <p className="mt-4 text-sm text-slate-400">
            No account yet? <Link href="/register" className="text-cyan-300 hover:text-cyan-200">Register</Link>
          </p>
        </Panel>

        <div className="rounded-[2rem] border border-white/10 bg-white/6 p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Demo login</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">Fast access for teams</h2>
          <p className="mt-4 max-w-xl text-slate-300">Use the seeded accounts to verify the database connection and enter the workspace.</p>
          <div className="mt-8 space-y-3 text-sm text-slate-200">
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">admin@tasktimer.app / admin123</div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">demo@tasktimer.app / demo123</div>
          </div>
        </div>
      </div>
    </div>
  );
}
