import { Skeleton } from "./ui/skeleton";

export function SkeletonList() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className="grid gap-3 rounded-lg border bg-muted/40 p-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/5" />
          <div className="flex gap-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}

