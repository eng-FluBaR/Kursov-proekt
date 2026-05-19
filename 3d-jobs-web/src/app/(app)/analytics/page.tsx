import { CsvExportButton } from '@/components/csv-export-button';
import { Panel, SectionHeading } from '@/components/workspace-ui';

const projectHours = [
  { name: 'Demo Production Line', value: 34, color: '#6366f1' },
  { name: 'Architectural Model', value: 42, color: '#0ea5e9' },
  { name: 'Prototype Lab', value: 68, color: '#14b8a6' },
  { name: 'Client Review Queue', value: 29, color: '#f97316' },
];

const taskShare = [
  { name: 'Modelling', value: 34, color: '#22d3ee' },
  { name: 'Printing', value: 21, color: '#f59e0b' },
  { name: 'Scanning', value: 15, color: '#10b981' },
  { name: 'Review', value: 18, color: '#fb7185' },
  { name: 'Research', value: 12, color: '#a78bfa' },
];

const heatmapWeeks = [
  [1, 0, 2, 3, 1, 0, 1],
  [0, 2, 1, 4, 2, 1, 0],
  [1, 1, 3, 5, 3, 2, 1],
  [0, 0, 2, 4, 5, 4, 2],
  [1, 2, 3, 3, 2, 1, 0],
];

const csvRows = projectHours.map((project) => ({ project: project.name, hours: project.value }));

export default function AnalyticsPage() {
  const total = projectHours.reduce((sum, project) => sum + project.value, 0);
  const donutSegments = taskShare.reduce(
    (chart, item) => {
      const nextOffset = chart.offset + (item.value / 100) * 360;
      return {
        offset: nextOffset,
        segments: [...chart.segments, `${item.color} ${chart.offset}deg ${nextOffset}deg`],
      };
    },
    { offset: 0, segments: [] as string[] }
  );
  const donutStyle = { background: `conic-gradient(${donutSegments.segments.join(', ')})` };

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Analytics"
        title="Performance and activity"
        description="Bars, a donut chart, heatmap, date range controls, and a CSV export action."
        actions={
          <>
            <input type="date" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
            <input type="date" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
            <CsvExportButton filename="tasktimer-project-hours.csv" headers={["project", "hours"]} rows={csvRows} />
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel className="p-6">
          <SectionHeading eyebrow="Bar chart" title="Total hours per project" description="Simple bars made with Tailwind and CSS variables." />
          <div className="space-y-4">
            {projectHours.map((project) => {
              const width = `${(project.value / 70) * 100}%`;
              return (
                <div key={project.name}>
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                    <span>{project.name}</span>
                    <span>{project.value}h</span>
                  </div>
                  <div className="h-4 rounded-full bg-white/5">
                    <div className="h-full rounded-full" style={{ width, backgroundColor: project.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel className="p-6">
          <SectionHeading eyebrow="Donut" title="Task type share" description="A colour-coded breakdown of where time goes." />
          <div className="flex flex-col items-center gap-5">
            <div className="relative h-52 w-52 rounded-full" style={donutStyle}>
              <div className="absolute inset-[28px] rounded-full border border-white/10 bg-slate-950/90" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Total</p>
                  <p className="text-3xl font-semibold text-white">{total}h</p>
                </div>
              </div>
            </div>
            <div className="grid w-full gap-2 sm:grid-cols-2">
              {taskShare.map((item) => (
                <div key={item.name} className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-3 text-sm text-slate-200">
                  <span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  {item.name} • {item.value}%
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <Panel className="p-6">
        <SectionHeading eyebrow="Heatmap" title="Most active days and hours" description="Darker tiles indicate more tracked activity." />
        <div className="grid gap-2">
          {heatmapWeeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-2">
              {week.map((value, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className="aspect-square rounded-xl border border-white/5"
                  style={{ backgroundColor: `rgba(34, 211, 238, ${0.08 + value * 0.12})` }}
                  title={`${value} tracked sessions`}
                />
              ))}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
