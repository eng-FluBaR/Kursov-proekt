import type { HTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';

export function Panel({ children, className = '', ...props }: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return <section {...props} className={`rounded-3xl border border-white/10 bg-white/6 shadow-[0_24px_80px_rgba(15,23,42,0.35)] backdrop-blur ${className}`}>{children}</section>;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300/80">{eyebrow}</p> : null}
        <h2 className="mt-2 text-2xl font-semibold text-white md:text-3xl">{title}</h2>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  detail,
  tone = 'cyan',
  href,
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: 'cyan' | 'amber' | 'emerald' | 'rose';
  href?: string;
}) {
  const toneClasses = {
    cyan: 'from-cyan-400/25 to-sky-400/10 border-cyan-300/15',
    amber: 'from-amber-400/25 to-orange-400/10 border-amber-300/15',
    emerald: 'from-emerald-400/25 to-teal-400/10 border-emerald-300/15',
    rose: 'from-rose-400/25 to-pink-400/10 border-rose-300/15',
  }[tone];

  const content = (
    <>
      <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-300/80">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      {detail ? <p className="mt-2 text-sm text-slate-300">{detail}</p> : null}
    </>
  );

  const className = `block rounded-3xl border bg-gradient-to-br ${toneClasses} p-5 ${
    href ? 'transition hover:-translate-y-0.5 hover:border-white/25 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-cyan-300/40' : ''
  }`;

  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/15 bg-white/4 p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-lg text-cyan-200">∅</div>
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/8 ${className}`} />;
}

export function ProjectDot({ color }: { color: string }) {
  return <span className="inline-flex h-3 w-3 rounded-full ring-4 ring-white/10" style={{ backgroundColor: color }} />;
}

export function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
