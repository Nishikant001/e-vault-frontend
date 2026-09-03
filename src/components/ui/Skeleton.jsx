function Shimmer({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-app-sm bg-[var(--surface-sunken)] ${className}`}
    />
  );
}

export function SkeletonText({ lines = 1, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Shimmer key={i} className={`h-3 ${i === lines - 1 && lines > 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }) {
  return (
    <div className={`rounded-app-lg border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 ${className}`}>
      <Shimmer className="mb-4 h-4 w-1/3" />
      <Shimmer className="mb-2 h-3 w-full" />
      <Shimmer className="h-3 w-4/5" />
    </div>
  );
}

export function SkeletonTableRows({ rows = 5, cols = 4 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-[var(--border-subtle)]">
          {Array.from({ length: cols }).map((__, c) => (
            <td key={c} className="px-4 py-3">
              <Shimmer className="h-3.5 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default Shimmer;
