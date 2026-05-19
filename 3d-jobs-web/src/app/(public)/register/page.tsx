import Link from 'next/link';

import { RegisterForm } from '@/components/register-form';
import { Panel, SectionHeading } from '@/components/workspace-ui';

export default function RegisterPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-8 md:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/6 p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Join the workspace</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold text-white md:text-5xl">Create an account and start tracking jobs immediately.</h1>
          <p className="mt-4 max-w-xl text-slate-300">Create a real user in Neon, then continue directly into the workspace.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-200">Crew-friendly onboarding</div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-200">Project-level visibility</div>
          </div>
        </div>

        <Panel className="p-8">
          <SectionHeading eyebrow="Sign up" title="Register" description="Enter an email and password to create a new account." />
          <RegisterForm />
          <p className="mt-4 text-sm text-slate-400">Already have an account? <Link href="/login" className="text-cyan-300 hover:text-cyan-200">Login</Link></p>
        </Panel>
      </div>
    </div>
  );
}
