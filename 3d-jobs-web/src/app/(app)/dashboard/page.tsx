import { DashboardTimer } from '@/components/dashboard-timer';
import { EmptyState, Panel, ProjectDot, SectionHeading, StatCard } from '@/components/workspace-ui';

const projects = [
  { id: 'demo-production', label: 'Demo Production Line', color: '#6366f1' },
  { id: 'architectural-model', label: 'Architectural Model', color: '#0ea5e9' },
  { id: 'prototype-lab', label: 'Prototype Lab', color: '#14b8a6' },
  { id: 'client-review', label: 'Client Review Queue', color: '#f97316' },
];

const taskTypes = [
  { id: 'modelling', label: '3D Modelling', color: '#7dd3fc' },
  { id: 'printing', label: '3D Printing', color: '#fca5a5' },
  { id: 'scanning', label: '3D Scanning', color: '#99f6e4' },
  { id: 'review', label: 'Client review', color: '#fdba74' },
];

const recentEntries = [
  { project: 'Demo Production Line', task: 'Scanning prep', time: '15 min ago', duration: '01:35', color: '#6366f1' },
  { project: 'Prototype Lab', task: 'Modeling session', time: '1 hr ago', duration: 'Open', color: '#14b8a6' },
  { project: 'Architectural Model', task: 'Print started', time: '3 hr ago', duration: '02:00', color: '#0ea5e9' },
  { project: 'Client Review Queue', task: 'Feedback review', time: '5 hr ago', duration: '00:45', color: '#f97316' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Dashboard"
        title="Today at a glance"
        description="Daily summary cards, a live timer, and recent activity for the currently tracked jobs."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tracked today" value="07h 42m" detail="+18% vs yesterday" tone="cyan" />
        <StatCard label="Active timers" value="1" detail="Modeling in progress" tone="emerald" />
        <StatCard label="Open projects" value="4" detail="1 archived" tone="amber" />
        <StatCard label="Pending files" value="5" detail="Ready for review" tone="rose" />
      </div>

      <Panel className="p-6">
        <DashboardTimer projects={projects} taskTypes={taskTypes} />
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel className="p-6">
          <SectionHeading eyebrow="Recent entries" title="Latest time logs" description="The most recent sessions across your projects." />
          <div className="space-y-3">
            {recentEntries.map((entry) => (
              <div key={`${entry.project}-${entry.task}`} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4">
                <div className="flex items-center gap-3">
                  <ProjectDot color={entry.color} />
                  <div>
                    <p className="font-medium text-white">{entry.task}</p>
                    <p className="text-sm text-slate-400">{entry.project} • {entry.time}</p>
                  </div>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-200">{entry.duration}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-6">
          <SectionHeading eyebrow="Empty states" title="No entries yet" description="When a list is empty, the UI still explains what should happen next." />
          <EmptyState title="No recent entries" description="This section gracefully handles an empty recent-activity list." />
        </Panel>
      </div>
    </div>
  );
}
