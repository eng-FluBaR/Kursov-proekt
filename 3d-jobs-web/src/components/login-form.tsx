'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

const demoAccounts = [
  { email: 'admin@tasktimer.app', password: 'admin123', label: 'Admin' },
  { email: 'demo@tasktimer.app', password: 'demo123', label: 'Demo' },
];

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@tasktimer.app');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? 'Login failed.');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Login request failed. Check that the web server is running.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={submitLogin}>
      <label className="block space-y-2">
        <span className="text-sm text-slate-300">Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@studio.com"
          autoComplete="email"
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-300/40"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm text-slate-300">Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-300/40"
        />
      </label>
      {error ? (
        <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
      <div className="grid gap-2 sm:grid-cols-2">
        {demoAccounts.map((account) => (
          <button
            key={account.email}
            type="button"
            onClick={() => {
              setEmail(account.email);
              setPassword(account.password);
              setError('');
            }}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-slate-200 transition hover:border-cyan-300/40"
          >
            <span className="block font-semibold text-white">{account.label}</span>
            <span className="text-xs text-slate-400">{account.email}</span>
          </button>
        ))}
      </div>
    </form>
  );
}
