import Skeleton from "@/components/skeletons/Skeleton";

export default function ContactsSkeleton() {
  return (
    <div className="flex-1">
      <header className="sticky top-0 z-10 bg-white dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-9 w-36 mb-3" />
          <div className="flex items-center gap-4">
            <Skeleton className="flex-1 h-10 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-20 rounded-md" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="px-4 pb-6 sm:px-0 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-zinc-800 shadow-md rounded-lg p-4 sm:p-6"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-4 w-28 hidden sm:block" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
