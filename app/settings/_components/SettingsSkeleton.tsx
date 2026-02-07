import Skeleton from "@/components/skeletons/Skeleton";

export default function SettingsSkeleton() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 flex flex-col items-center py-8">
        <div className="bg-white dark:bg-zinc-800 p-8 rounded-lg shadow-lg w-96 mb-6">
          <Skeleton className="h-7 w-24 mx-auto mb-1" />
          <Skeleton className="h-4 w-32 mx-auto mb-6" />

          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ))}
          </div>
        </div>

        <div className="w-96 space-y-3">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </main>
    </div>
  );
}
