import { CardGridSkeleton } from "@/components/ui/states";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="mt-4 h-5 w-96 max-w-full" />
      <div className="mt-8">
        <CardGridSkeleton />
      </div>
    </div>
  );
}
