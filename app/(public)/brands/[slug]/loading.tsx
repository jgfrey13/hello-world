import { Skeleton } from "@/components/ui/skeleton";
import { CardGridSkeleton } from "@/components/ui/states";

export default function BrandProfileLoading() {
  return (
    <div
      role="status"
      aria-label="Loading brand profile"
      className="mx-auto max-w-6xl px-4 py-12 sm:px-6"
    >
      <Skeleton className="h-4 w-56" />
      <Skeleton className="mt-8 h-10 w-72 max-w-full" />
      <Skeleton className="mt-4 h-5 w-full max-w-2xl" />
      <Skeleton className="mt-2 h-5 w-2/3 max-w-xl" />
      <Skeleton className="mt-10 h-7 w-52" />
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-80 max-w-full" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      <Skeleton className="mt-10 h-7 w-32" />
      <div className="mt-4">
        <CardGridSkeleton count={3} />
      </div>
    </div>
  );
}
