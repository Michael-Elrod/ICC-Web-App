import Skeleton from "./Skeleton";

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export default function SkeletonText({
  lines = 3,
  className = "",
}: SkeletonTextProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? "w-3/4" : "w-full"}`}
        />
      ))}
    </div>
  );
}
