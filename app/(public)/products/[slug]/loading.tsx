import { Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <div
      role="status"
      aria-label="Loading product"
      className="mx-auto max-w-6xl px-4 py-12 sm:px-6"
    >
      <Skeleton className="h-4 w-64" />
      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <Skeleton className="h-80 w-full" />
        <div>
          <Skeleton className="h-10 w-72 max-w-full" />
          <Skeleton className="mt-4 h-5 w-full" />
          <Skeleton className="mt-2 h-5 w-2/3" />
          <Skeleton className="mt-8 h-11 w-48" />
          <Skeleton className="mt-6 h-4 w-80 max-w-full" />
        </div>
      </div>
    </div>
  );
}
