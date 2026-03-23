import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
};

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      {icon ? (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400">
          {icon}
        </div>
      ) : null}
      <h3 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
