import { CardSkeleton } from "@/components/control/CardSkeleton";

type ControlLoadingStateProps = {
  variant?: "cards" | "table" | "mixed";
};

export function ControlLoadingState({ variant = "mixed" }: ControlLoadingStateProps) {
  if (variant === "cards") {
    return (
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CardSkeleton count={4} />
      </section>
    );
  }

  if (variant === "table") {
    return (
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="space-y-3 p-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CardSkeleton count={4} />
      </section>
      <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white" />
    </div>
  );
}
