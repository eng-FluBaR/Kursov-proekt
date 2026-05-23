import { DashboardTimer } from '@/components/dashboard-timer';
import { TimeEntriesList } from '@/components/time-entries-list';
import { EmptyState, Panel, SectionHeading, StatCard } from '@/components/workspace-ui';

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
          <TimeEntriesList />
        </Panel>

        <Panel className="p-6">
          <SectionHeading eyebrow="Empty states" title="No entries yet" description="When a list is empty, the UI still explains what should happen next." />
          <EmptyState title="No recent entries" description="This section gracefully handles an empty recent-activity list." />
        </Panel>
      </div>
    </div>
  );
}
