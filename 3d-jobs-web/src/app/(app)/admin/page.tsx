import { Panel, SectionHeading, StatCard } from '@/components/workspace-ui';

const users = [
  { email: 'admin@tasktimer.app', role: 'admin', active: true, lastSeen: '2m ago' },
  { email: 'demo@tasktimer.app', role: 'user', active: true, lastSeen: '12m ago' },
  { email: 'maker@tasktimer.app', role: 'user', active: false, lastSeen: '1h ago' },
  { email: 'studio@tasktimer.app', role: 'user', active: false, lastSeen: '4h ago' },
  { email: 'ops@tasktimer.app', role: 'user', active: true, lastSeen: '9m ago' },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Admin" title="Workspace administration" description="Global stats and a user table with role selectors." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total users" value="5" detail="2 active right now" tone="cyan" />
        <StatCard label="Active projects" value="4" detail="1 archived" tone="emerald" />
        <StatCard label="Files stored" value="5" detail="Uploads across entries" tone="amber" />
        <StatCard label="Timer sessions" value="8" detail="Demo dataset" tone="rose" />
      </div>

      <Panel className="p-6">
        <SectionHeading eyebrow="User table" title="Roles and access" description="Change roles directly in the table UI." />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.22em] text-slate-400">
                <th className="px-4 py-2">User</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Last seen</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.email} className="rounded-2xl bg-slate-950/60 text-sm text-slate-200">
                  <td className="rounded-l-2xl px-4 py-4 font-medium text-white">{user.email}</td>
                  <td className="px-4 py-4">
                    <select defaultValue={user.role} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none">
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.active ? 'bg-emerald-400/15 text-emerald-100' : 'bg-white/8 text-slate-300'}`}>{user.active ? 'active' : 'idle'}</span>
                  </td>
                  <td className="px-4 py-4 text-slate-300">{user.lastSeen}</td>
                  <td className="rounded-r-2xl px-4 py-4">
                    <button type="button" className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white">Save</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
