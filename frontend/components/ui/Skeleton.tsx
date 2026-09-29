export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`animate-pulse rounded-lg border-2 border-[color:var(--border)] bg-[color:var(--card-muted)] motion-reduce:animate-none ${className}`}
    />
  );
}
