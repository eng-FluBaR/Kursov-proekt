import { Panel, SectionHeading, ProjectDot } from '@/components/workspace-ui';

const projectOptions = [
  { label: 'Demo Production Line', color: '#6366f1' },
  { label: 'Architectural Model', color: '#0ea5e9' },
  { label: 'Prototype Lab', color: '#14b8a6' },
];

const taskTypes = ['3D Modelling', '3D Printing', '3D Scanning', 'CAD Design', 'Post-processing'];

export default function LogPage() {
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Manual log" title="Add a time entry" description="Choose project, task type, date and times, then attach images or 3D files." />

      <Panel className="p-6">
        <form className="grid gap-4 xl:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Project</span>
            <select className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none">
              {projectOptions.map((project) => (
                <option key={project.label} value={project.label}>{project.label}</option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm text-slate-300">Task type</span>
            <select className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none">
              {taskTypes.map((task) => <option key={task}>{task}</option>)}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm text-slate-300">Date</span>
            <input type="date" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-slate-300">Start time</span>
            <input type="time" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-slate-300">End time</span>
            <input type="time" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
          </label>

          <label className="space-y-2 xl:col-span-2">
            <span className="text-sm text-slate-300">Optional note</span>
            <textarea rows={4} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" placeholder="Add context, blockers, or results" />
          </label>

          <label className="space-y-2 xl:col-span-2">
            <span className="text-sm text-slate-300">File upload</span>
            <input accept=".jpg,.png,.webp,.stl,.obj,.3mf,.step" type="file" multiple className="w-full rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-300 file:px-4 file:py-2 file:font-semibold file:text-slate-950" />
            <p className="text-xs text-slate-400">Accepts .jpg .png .webp .stl .obj .3mf .step</p>
          </label>

          <div className="xl:col-span-2 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 p-4">
            <div className="flex items-center gap-3">
              <ProjectDot color="#38bdf8" />
              <span className="text-sm text-slate-200">Manual entries can also be used when the timer is not running.</span>
            </div>
            <button type="submit" className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950">Save entry</button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
