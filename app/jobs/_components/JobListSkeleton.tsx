import Skeleton from "@/components/skeletons/Skeleton";

export default function JobListSkeleton() {
  return (
    <div className="px-0 sm:px-4 md:px-0">
      {/* Search bar */}
      <div className="mb-4">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>

      {/* Job card placeholders */}
      {[1, 2].map((n) => (
        <div
          key={n}
          className="bg-white dark:bg-zinc-800 shadow-md sm:rounded-lg mb-4 p-4 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-10 w-full sm:w-36 rounded" />
          </div>

          {/* Status bars */}
          <div className="space-y-3 mb-4">
            <Skeleton className="h-6 w-full rounded-full" />
            <Skeleton className="h-6 w-full rounded-full" />
            <Skeleton className="h-6 w-full rounded-full" />
          </div>

          {/* Timeline placeholder */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2 ml-6" />
            <Skeleton className="h-4 w-2/3 ml-3" />
          </div>
        </div>
      ))}
    </div>
  );
}
