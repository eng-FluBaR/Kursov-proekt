import { Panel, SectionHeading } from '@/components/workspace-ui';

const calendarDays = Array.from({ length: 30 }, (_, index) => index + 1);

type CalendarEvent = {
  label: string;
  color: string;
  span: string;
  overlap?: boolean;
};

const events: Record<number, CalendarEvent[]> = {
  2: [{ label: 'Prototype Lab', color: '#14b8a6', span: '10:00-12:30' }],
  4: [
    { label: 'Architectural Model', color: '#0ea5e9', span: '09:30-11:00' },
    { label: 'Client review', color: '#f97316', span: '10:45-12:00', overlap: true },
  ],
  8: [{ label: '3D Scanning', color: '#6366f1', span: '14:00-16:15' }],
  12: [{ label: 'Rendering', color: '#f59e0b', span: '13:00-15:45' }],
  16: [{ label: 'Research', color: '#8b5cf6', span: '08:30-10:00' }],
  19: [
    { label: '3D Printing', color: '#0ea5e9', span: '11:00-13:20' },
    { label: 'Print queue', color: '#93c5fd', span: '12:50-14:30', overlap: true },
  ],
  24: [{ label: 'Post-processing', color: '#22c55e', span: '15:00-16:10' }],
  28: [{ label: 'Admin review', color: '#fb7185', span: '09:00-10:30' }],
};

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Calendar" title="Monthly view" description="Colour-coded sessions, overlapping blocks, and a quick visual scan of the month." />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel className="p-6">
          <div className="grid grid-cols-7 gap-3 text-center text-xs uppercase tracking-[0.22em] text-slate-400">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <div key={day}>{day}</div>)}
          </div>

          <div className="mt-3 grid grid-cols-7 gap-3">
            {Array.from({ length: 7 }).map((_, index) => <div key={`blank-${index}`} className="h-28 rounded-3xl border border-white/5 bg-white/3" />)}
            {calendarDays.map((day) => {
              const dayEvents = events[day as keyof typeof events] ?? [];
              return (
                <div key={day} className="min-h-28 rounded-3xl border border-white/10 bg-slate-950/60 p-3">
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span className="font-semibold text-white">{day}</span>
                    {dayEvents.length > 1 ? <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] text-amber-100">Overlap</span> : null}
                  </div>
                  <div className="mt-3 space-y-2">
                            {dayEvents.map((event) => (
                      <div
                        key={event.label}
                        className={`rounded-2xl px-3 py-2 text-xs font-medium text-slate-950 ${event.overlap ? 'border border-white/20 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.4)_0,rgba(255,255,255,0.4)_7px,transparent_7px,transparent_14px)]' : ''}`}
                        style={{ backgroundColor: event.color }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span>{event.label}</span>
                          <span className="text-[11px] opacity-80">{event.span}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel className="p-6">
          <SectionHeading eyebrow="Highlights" title="Today’s overlaps" description="When tasks overlap, the UI uses a striped treatment and stacked blocks." />
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-sm font-semibold text-white">3D Printing → Print queue</p>
              <p className="mt-1 text-sm text-slate-400">12:50 - 14:30</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-sm font-semibold text-white">Architectural Model → Client review</p>
              <p className="mt-1 text-sm text-slate-400">10:45 - 12:00</p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
