import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
  trend?: string;
  icon?: ReactNode;
};

export function StatCard({ label, value, hint, trend, icon }: StatCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        {icon ? <div className="text-slate-400">{icon}</div> : null}
      </div>

      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>

      {trend ? <p className="mt-2 text-xs font-medium text-slate-500">{trend}</p> : null}
      {!trend && hint ? <p className="mt-2 text-xs font-medium text-slate-500">{hint}</p> : null}
      {trend && hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </article>
  );
}
