interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-zinc-200 dark:bg-zinc-700 rounded ${className}`}
    />
  );
}
