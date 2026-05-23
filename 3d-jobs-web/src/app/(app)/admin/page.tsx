'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Panel, SectionHeading, StatCard } from '@/components/workspace-ui';

type AdminUser = {
  id: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
  jobCount: number;
  sessionCount: number;
};

type ShareUser = { id: string; email: string; role: 'admin' | 'user' };
type ShareJob = {
  id: string;
  title: string;
  status: string;
  ownerId: string;
  ownerEmail: string | null;
  projectName: string | null;
  taskTypeName: string | null;
};
type SharePermission = {
  id: string;
  viewerId: string;
  jobId: string;
  grantorId: string;
  createdAt: string;
};
type TimeByType = {
  userEmail: string;
  taskTypeName: string | null;
  minutes: number;
  sessions: number;
};

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [shareUsers, setShareUsers] = useState<ShareUser[]>([]);
  const [jobs, setJobs] = useState<ShareJob[]>([]);
  const [permissions, setPermissions] = useState<SharePermission[]>([]);
  const [timeByType, setTimeByType] = useState<TimeByType[]>([]);
  const [totals, setTotals] = useState({ users: 0, projects: 0, jobs: 0, files: 0, sessions: 0 });
  const [viewerId, setViewerId] = useState('');
  const [viewerIds, setViewerIds] = useState<string[]>([]);
  const [jobId, setJobId] = useState('');
  const [newPasswords, setNewPasswords] = useState<Record<string, string>>({});
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const jobsForSelectedViewer = useMemo(
    () => jobs.filter((job) => job.ownerId !== viewerId),
    [jobs, viewerId],
  );

  const loadAdminData = useCallback(async () => {
    setStatus('');
    setIsLoading(true);

    try {
      const [usersResponse, statsResponse, sharesResponse] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/stats'),
        fetch('/api/admin/job-shares'),
      ]);

      if (usersResponse.status === 403 || statsResponse.status === 403 || sharesResponse.status === 403) {
        setStatus('Only admins can open this page.');
        return;
      }

      if (!usersResponse.ok || !statsResponse.ok || !sharesResponse.ok) {
        throw new Error('Could not load admin data.');
      }

      const usersData = (await usersResponse.json()) as { users: AdminUser[] };
      const statsData = (await statsResponse.json()) as { totals: typeof totals; timeByType: TimeByType[] };
      const sharesData = (await sharesResponse.json()) as {
        users: ShareUser[];
        jobs: ShareJob[];
        permissions: SharePermission[];
      };

      setUsers(usersData.users);
      setTotals(statsData.totals);
      setTimeByType(statsData.timeByType);
      setShareUsers(sharesData.users);
      setJobs(sharesData.jobs);
      setPermissions(sharesData.permissions);
      setViewerId((current) => current || sharesData.users.find((user) => user.role === 'user')?.id || '');
      setViewerIds((current) => current.length > 0 ? current : sharesData.users.filter((user) => user.role === 'user').slice(0, 1).map((user) => user.id));
      setJobId((current) => current || sharesData.jobs[0]?.id || '');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Admin data failed to load.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadAdminData);
  }, [loadAdminData]);

  async function updateRole(userId: string, role: 'admin' | 'user') {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    const data = (await response.json()) as { error?: string };
    setStatus(response.ok ? 'Role updated.' : data.error ?? 'Could not update role.');
    if (response.ok) {
      await loadAdminData();
    }
  }

  async function resetPassword(userId: string) {
    const password = newPasswords[userId] ?? '';
    const response = await fetch(`/api/admin/users/${userId}/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = (await response.json()) as { error?: string };
    setStatus(response.ok ? 'Password reset.' : data.error ?? 'Could not reset password.');
    if (response.ok) {
      setNewPasswords((current) => ({ ...current, [userId]: '' }));
    }
  }

  async function deleteUser(userId: string) {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = (await response.json()) as { error?: string };
    setStatus(response.ok ? 'User deleted.' : data.error ?? 'Could not delete user.');
    if (response.ok) {
      await loadAdminData();
    }
  }

  async function grantAccess() {
    const targetViewerIds = viewerIds.length > 0 ? viewerIds : [viewerId].filter(Boolean);
    const results = await Promise.all(targetViewerIds.map(async (targetViewerId) => {
      const response = await fetch('/api/admin/job-shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viewerId: targetViewerId, jobId }),
      });
      const data = (await response.json()) as { error?: string };
      return { ok: response.ok, error: data.error };
    }));
    const failed = results.filter((result) => !result.ok);
    setStatus(failed.length === 0 ? 'Task visibility granted.' : failed.map((result) => result.error ?? 'Could not grant access.').join(' '));
    if (failed.length === 0) {
      await loadAdminData();
    }
  }

  function toggleViewer(userId: string) {
    setViewerIds((current) => current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]);
    setViewerId(userId);
  }

  async function revokeAccess(permissionId: string) {
    const response = await fetch('/api/admin/job-shares', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissionId }),
    });
    const data = (await response.json()) as { error?: string };
    setStatus(response.ok ? 'Task visibility removed.' : data.error ?? 'Could not revoke access.');
    if (response.ok) {
      await loadAdminData();
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Admin"
        title="Workspace administration"
        description="Manage users, passwords, task visibility, and time spent by task type."
      />

      {status ? <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100">{status}</div> : null}
      {isLoading ? <div className="text-sm text-slate-300">Loading admin data...</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Users" value={String(totals.users)} detail="Registered accounts" tone="cyan" />
        <StatCard label="Projects" value={String(totals.projects)} detail="All owners" tone="emerald" />
        <StatCard label="Jobs" value={String(totals.jobs)} detail="Tracked tasks" tone="amber" />
        <StatCard label="Files" value={String(totals.files)} detail="Uploaded assets" tone="rose" />
        <StatCard label="Sessions" value={String(totals.sessions)} detail="Timer entries" tone="cyan" />
      </div>

      <Panel className="p-6">
        <SectionHeading eyebrow="Users" title="Accounts and security" description="Change roles, reset forgotten passwords, or remove accounts." />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.22em] text-slate-400">
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Jobs</th>
                <th className="px-4 py-2">Sessions</th>
                <th className="px-4 py-2">New password</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="bg-slate-950/60 text-sm text-slate-200">
                  <td className="rounded-l-2xl px-4 py-4 font-medium text-white">{user.email}</td>
                  <td className="px-4 py-4">
                    <select
                      value={user.role}
                      onChange={(event) => updateRole(user.id, event.target.value as 'admin' | 'user')}
                      className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none"
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-4">{user.jobCount}</td>
                  <td className="px-4 py-4">{user.sessionCount}</td>
                  <td className="px-4 py-4">
                    <input
                      type="password"
                      value={newPasswords[user.id] ?? ''}
                      onChange={(event) => setNewPasswords((current) => ({ ...current, [user.id]: event.target.value }))}
                      className="w-44 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none"
                      placeholder="Min 6 chars"
                    />
                  </td>
                  <td className="rounded-r-2xl px-4 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => resetPassword(user.id)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white">Reset</button>
                      <button onClick={() => deleteUser(user.id)} className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs font-semibold text-rose-100">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel className="p-6">
        <SectionHeading eyebrow="Tasks" title="Task owners" description="Every task is linked to its owner so admin reporting is easier to follow." />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.22em] text-slate-400">
                <th className="px-4 py-2">Task</th>
                <th className="px-4 py-2">Owner</th>
                <th className="px-4 py-2">Project</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="bg-slate-950/60 text-sm text-slate-200">
                  <td className="rounded-l-2xl px-4 py-3">
                    <Link href={`/jobs?jobId=${job.id}`} className="font-semibold text-cyan-100 hover:text-cyan-200">
                      {job.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <a href={`mailto:${job.ownerEmail ?? ''}`} className="text-white hover:text-cyan-100">{job.ownerEmail ?? 'Unknown owner'}</a>
                  </td>
                  <td className="px-4 py-3">{job.projectName ?? 'No project'}</td>
                  <td className="px-4 py-3">{job.taskTypeName ?? 'No task type'}</td>
                  <td className="rounded-r-2xl px-4 py-3 capitalize">{job.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel className="p-6">
        <SectionHeading eyebrow="Visibility" title="Share selected tasks" description="Grant several users access to one specific task. Each user still tracks their own time separately." />
        <div className="grid gap-3 md:grid-cols-[1.1fr_1.6fr_auto]">
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-3">
            <p className="mb-2 text-xs uppercase tracking-[0.22em] text-slate-400">Users</p>
            <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
              {shareUsers.map((user) => (
                <label key={user.id} className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 text-sm text-slate-200 hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={viewerIds.includes(user.id)}
                    onChange={() => toggleViewer(user.id)}
                    className="h-4 w-4 accent-cyan-300"
                  />
                  <span className="truncate">{user.email}</span>
                </label>
              ))}
            </div>
          </div>
          <select value={jobId} onChange={(event) => setJobId(event.target.value)} className="rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-white outline-none">
            {jobsForSelectedViewer.map((job) => (
              <option key={job.id} value={job.id}>{job.title} - {job.ownerEmail ?? 'unknown'} - {job.taskTypeName ?? 'Task'}</option>
            ))}
          </select>
          <button onClick={grantAccess} className="rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950">Grant access</button>
        </div>

        <div className="mt-5 space-y-2">
          {permissions.length === 0 ? <p className="text-sm text-slate-400">No shared tasks yet.</p> : null}
          {permissions.map((permission) => {
            const viewer = shareUsers.find((user) => user.id === permission.viewerId);
            const job = jobs.find((item) => item.id === permission.jobId);
            return (
              <div key={permission.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-200 md:flex-row md:items-center md:justify-between">
                <span>{viewer?.email ?? 'Unknown user'} can view {job?.title ?? 'Unknown task'} from {job?.ownerEmail ?? 'unknown owner'}</span>
                <button onClick={() => revokeAccess(permission.id)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white">Revoke</button>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel className="p-6">
        <SectionHeading eyebrow="Reporting" title="Time by user and task type" description="A quick admin overview of where time is going." />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.22em] text-slate-400">
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Task type</th>
                <th className="px-4 py-2">Sessions</th>
                <th className="px-4 py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {timeByType.map((row, index) => (
                <tr key={`${row.userEmail}-${row.taskTypeName ?? 'none'}-${index}`} className="bg-slate-950/60 text-sm text-slate-200">
                  <td className="rounded-l-2xl px-4 py-3 font-medium text-white">{row.userEmail}</td>
                  <td className="px-4 py-3">{row.taskTypeName ?? 'No task type'}</td>
                  <td className="px-4 py-3">{row.sessions}</td>
                  <td className="rounded-r-2xl px-4 py-3">{formatMinutes(Number(row.minutes))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
