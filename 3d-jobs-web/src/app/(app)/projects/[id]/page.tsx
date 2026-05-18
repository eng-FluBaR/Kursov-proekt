import { notFound } from 'next/navigation';

import { Panel, ProjectDot, SectionHeading } from '@/components/workspace-ui';

const projects = [
  { id: 'demo-production', name: 'Demo Production Line', color: '#6366f1', hours: '34h 20m', tasks: { Modelling: 34, Printing: 28, Review: 18, Research: 20 } },
  { id: 'architectural-model', name: 'Architectural Model', color: '#0ea5e9', hours: '42h 10m', tasks: { Modelling: 56, Printing: 12, Review: 20, Research: 12 } },
  { id: 'prototype-lab', name: 'Prototype Lab', color: '#14b8a6', hours: '68h 05m', tasks: { Modelling: 44, Printing: 31, Review: 10, Research: 15 } },
  { id: 'client-review', name: 'Client Review Queue', color: '#f97316', hours: '29h 45m', tasks: { Modelling: 15, Printing: 10, Review: 55, Research: 20 } },
];

const entries = [
  { day: 'Today', task: 'Morning scan prep', duration: '01:35', note: 'Surface checks and cleanup' },
  { day: 'Yesterday', task: 'Render preview export', duration: '00:50', note: 'Updated lighting pass' },
  { day: 'Yesterday', task: 'Post-processing cleanup', duration: '01:00', note: 'Support removal and sanding' },
  { day: '2 days ago', task: 'Client review', duration: '00:45', note: 'Feedback addressed' },
];

export default function ProjectPage({ params }: { params: { id: string } }) {
  const project = projects.find((item) => item.id === params.id);

  if (!project) {
    notFound();
  }

  const taskEntries = Object.entries(project.tasks);
  const total = taskEntries.reduce((sum, [, value]) => sum + value, 0);

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Project detail" title={project.name} description="All entries, project stats, and task type breakdown in one place." />

      <Panel className="p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
            <ProjectDot color={project.color} />
            <div>
              <p className="text-sm text-slate-400">Project colour</p>
              <p className="font-semibold text-white">{project.color}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
            <p className="text-sm text-slate-400">Total hours</p>
            <p className="font-semibold text-white">{project.hours}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
            <p className="text-sm text-slate-400">Entries</p>
            <p className="font-semibold text-white">{entries.length}</p>
          </div>
        </div>
        <div className="mt-6 h-3 rounded-full bg-white/5">
          <div className="h-full rounded-full" style={{ width: '72%', backgroundColor: project.color }} />
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <Panel className="p-6">
          <SectionHeading eyebrow="Entries" title="Project activity" description="The full list of sessions tied to this project." />
          <div className="space-y-3">
            {entries.map((entry) => (
              <div key={`${entry.day}-${entry.task}`} className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">{entry.task}</p>
                    <p className="text-sm text-slate-400">{entry.day} • {entry.note}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-200">{entry.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-6">
          <SectionHeading eyebrow="Breakdown" title="Task types" description="Visual distribution of work across task categories." />
          <div className="space-y-4">
            {taskEntries.map(([label, value]) => {
              const width = `${(value / total) * 100}%`;
              return (
                <div key={label}>
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                    <span>{label}</span>
                    <span>{value}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/5">
                    <div className="h-full rounded-full" style={{ width, backgroundColor: project.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}
