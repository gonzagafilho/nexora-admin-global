import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle: string;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">{title}</h1>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>

      {actions ? <div className="shrink-0">{actions}</div> : null}
    </section>
  );
}
