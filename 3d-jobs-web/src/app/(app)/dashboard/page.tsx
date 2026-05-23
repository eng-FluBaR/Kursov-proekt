import { DashboardUserStats } from '@/components/dashboard-user-stats';
import { DashboardTimer } from '@/components/dashboard-timer';
import { TimeEntriesList } from '@/components/time-entries-list';
import { EmptyState, Panel, SectionHeading } from '@/components/workspace-ui';

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
        title="Your time at a glance"
        description="Only your own task time, active timer, and recent activity are shown here."
      />

      <DashboardUserStats />

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
