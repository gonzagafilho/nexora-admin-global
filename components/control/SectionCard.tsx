import type { ReactNode } from "react";

type SectionCardProps = {
  children: ReactNode;
  className?: string;
};

export function SectionCard({ children, className = "" }: SectionCardProps) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 ${className}`.trim()}>
      {children}
    </section>
  );
}
