import { Skeleton } from "@/components/ui/skeleton";

export default function InformesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-5 w-56" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Skeleton className="h-[520px] rounded-xl" />
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-[360px] rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
