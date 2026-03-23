type CardSkeletonProps = {
  count?: number;
  className?: string;
};

export function CardSkeleton({ count = 4, className = "h-32" }: CardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`animate-pulse rounded-2xl border border-slate-200 bg-white ${className}`} />
      ))}
    </>
  );
}
