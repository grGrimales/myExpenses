import { Skeleton } from "@/components/ui/skeleton";

export default function GastosLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-5 w-28" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      <Skeleton className="h-14 rounded-xl" />

      <div className="rounded-xl border">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-0">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <Skeleton className="h-9 w-64" />
      </div>
    </div>
  );
}
