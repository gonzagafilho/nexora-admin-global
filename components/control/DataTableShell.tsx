import type { ReactNode } from "react";

type DataTableShellProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
};

export function DataTableShell({
  children,
  title,
  subtitle,
  actions,
  className = "",
}: DataTableShellProps) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 ${className}`.trim()}>
      {title || subtitle || actions ? (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? <h2 className="text-lg font-semibold text-slate-900">{title}</h2> : null}
            {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      ) : null}

      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}
