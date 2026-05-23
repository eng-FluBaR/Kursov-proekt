'use client';

import { useState } from 'react';

import { Panel, SectionHeading } from '@/components/workspace-ui';

type ThemeMode = 'dark' | 'light';

export default function SettingsPage() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') {
      return 'dark';
    }

    return window.localStorage.getItem('tasktimer-theme') === 'light' ? 'light' : 'dark';
  });

  function updateTheme(nextTheme: ThemeMode) {
    setTheme(nextTheme);
    window.localStorage.setItem('tasktimer-theme', nextTheme);
    window.dispatchEvent(new CustomEvent('tasktimer-theme-change', { detail: { theme: nextTheme } }));
  }

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Settings" title="Profile and security" description="Edit profile details, change your password, and switch the workspace theme." />

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel className="p-6">
          <SectionHeading eyebrow="Profile" title="Edit profile" description="Update the visible account details used throughout the workspace." />
          <form className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Display name</span>
              <input type="text" defaultValue="Petar Tonev" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Email</span>
              <input type="email" defaultValue="admin@tasktimer.app" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Timezone</span>
              <select defaultValue="Europe/Sofia" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none">
                <option>Europe/Sofia</option>
                <option>UTC</option>
                <option>America/New_York</option>
              </select>
            </label>
            <button type="submit" className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950">Save profile</button>
          </form>
        </Panel>

        <Panel className="p-6">
          <SectionHeading eyebrow="Appearance" title="Theme mode" description="Switch between dark and light workspace modes." />
          <div className="grid grid-cols-2 gap-3">
            {(['dark', 'light'] as ThemeMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => updateTheme(mode)}
                className={`rounded-2xl border px-4 py-4 text-sm font-semibold capitalize transition ${
                  theme === mode
                    ? 'border-cyan-300/40 bg-cyan-300/15 text-cyan-50'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </Panel>

        <Panel className="p-6 xl:col-span-2">
          <SectionHeading eyebrow="Security" title="Change password" description="Keep the account secure with a new password." />
          <form className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Current password</span>
              <input type="password" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">New password</span>
              <input type="password" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Confirm password</span>
              <input type="password" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
            </label>
            <button type="submit" className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950">Update password</button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
