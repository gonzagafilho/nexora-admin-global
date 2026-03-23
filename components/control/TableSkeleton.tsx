type TableSkeletonProps = {
  rows?: number;
};

export function TableSkeleton({ rows = 6 }: TableSkeletonProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="space-y-3 p-4">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="h-12 animate-pulse rounded-lg bg-slate-100" />
        ))}
      </div>
    </section>
  );
}
