import Skeleton from "@/components/skeletons/Skeleton";

export default function JobDetailSkeleton() {
  return (
    <>
      {/* Header */}
      <header className="mb-4 sm:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-baseline gap-2 sm:gap-4">
            <Skeleton className="h-8 sm:h-9 w-56" />
            <Skeleton className="h-5 sm:h-6 w-32" />
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Skeleton className="h-10 w-16 rounded" />
            <Skeleton className="h-10 w-24 rounded" />
            <Skeleton className="h-10 w-24 rounded" />
          </div>
        </div>
      </header>

      {/* Job Status */}
      <section className="mb-4 sm:mb-8">
        <Skeleton className="h-6 sm:h-7 w-28 mb-2 sm:mb-4" />
        <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-4 sm:p-6 w-full">
          <div className="space-y-3">
            <Skeleton className="h-6 w-full rounded-full" />
            <Skeleton className="h-6 w-full rounded-full" />
            <Skeleton className="h-6 w-full rounded-full" />
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="mb-4 sm:mb-8">
        <Skeleton className="h-6 sm:h-7 w-24 mb-2 sm:mb-4" />
        <div className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-4 sm:p-6 w-full">
          <div className="space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-1/2 ml-8" />
            <Skeleton className="h-5 w-2/3 ml-4" />
            <Skeleton className="h-5 w-5/6" />
          </div>
        </div>
      </section>

      {/* Tabs + Content */}
      <section className="mb-4 sm:mb-8">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <div className="flex gap-2 overflow-x-auto">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-20 rounded-md flex-shrink-0" />
            ))}
          </div>
        </div>
        <div className="mt-2 sm:mt-4 bg-white dark:bg-zinc-800 shadow-md rounded-lg p-1 sm:p-6">
          {/* Phase card placeholders */}
          {[1, 2].map((n) => (
            <div
              key={n}
              className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 mb-4 last:mb-0"
            >
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
