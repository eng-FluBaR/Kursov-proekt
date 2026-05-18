import Link from 'next/link';

import { EmptyState, Panel, ProjectDot, SectionHeading, StatCard } from '@/components/workspace-ui';

const projects = [
  { id: 'demo-production', name: 'Demo Production Line', color: '#6366f1', hours: '34h 20m', archived: false, description: 'Default admin project' },
  { id: 'architectural-model', name: 'Architectural Model', color: '#0ea5e9', hours: '42h 10m', archived: false, description: 'House and interior work' },
  { id: 'prototype-lab', name: 'Prototype Lab', color: '#14b8a6', hours: '68h 05m', archived: false, description: 'Hardware concepts and prints' },
  { id: 'client-review', name: 'Client Review Queue', color: '#f97316', hours: '29h 45m', archived: false, description: 'Feedback and revisions' },
  { id: 'research-sprint', name: 'Research Sprint', color: '#8b5cf6', hours: '12h 30m', archived: true, description: 'Materials and process experiments' },
];

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Projects" title="All projects" description="A colour-coded list with archive controls and a create-project form." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active projects" value="4" detail="1 archived" tone="cyan" />
        <StatCard label="Total hours" value="187h" detail="Across this workspace" tone="emerald" />
        <StatCard label="Average per project" value="37h" detail="Rolling mean" tone="amber" />
        <StatCard label="Files attached" value="5" detail="From demo entries" tone="rose" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel className="p-6">
          <div className="space-y-3">
            {projects.length ? projects.map((project) => (
              <div key={project.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4">
                <Link href={`/projects/${project.id}`} className="flex items-center gap-3">
                  <ProjectDot color={project.color} />
                  <div>
                    <p className="font-medium text-white">{project.name}</p>
                    <p className="text-sm text-slate-400">{project.description}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-200">{project.hours}</span>
                  <button type="button" className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-rose-400/10 hover:text-white">{project.archived ? 'Restore' : 'Archive'}</button>
                </div>
              </div>
            )) : (
              <EmptyState title="No projects yet" description="Create the first project to begin tracking work." action={<button className="rounded-2xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950">Create project</button>} />
            )}
          </div>
        </Panel>

        <Panel className="p-6">
          <SectionHeading eyebrow="Create new" title="Project form" description="A quick form for a new project with colour and description." />
          <form className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Project name</span>
              <input type="text" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" placeholder="New project name" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Color</span>
              <input type="color" defaultValue="#14b8a6" className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 p-2" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Description</span>
              <textarea rows={4} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" placeholder="Project scope and notes" />
            </label>
            <button type="submit" className="w-full rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950">Create project</button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
