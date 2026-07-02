import * as React from "react";
import { CircleAlert, Inbox, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/** Shared empty state — every list/detail surface must use one of these. */
function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-16 text-center",
        className,
      )}
    >
      <Inbox aria-hidden="true" className="text-muted-foreground size-8" />
      <h2 className="font-serif text-lg font-semibold">{title}</h2>
      {description && (
        <p className="text-muted-foreground max-w-md text-sm">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

function ErrorState({
  title = "Something went wrong",
  description = "Please try again. If the problem continues, contact us.",
  action,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "border-destructive/40 flex flex-col items-center justify-center gap-2 rounded-lg border px-6 py-16 text-center",
        className,
      )}
    >
      <CircleAlert aria-hidden="true" className="text-destructive size-8" />
      <h2 className="font-serif text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground max-w-md text-sm">{description}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

function LoadingState({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "text-muted-foreground flex items-center justify-center gap-2 px-6 py-16 text-sm",
        className,
      )}
    >
      <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
      {label}
    </div>
  );
}

/** Card-shaped skeleton grid for directory loading states. */
function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-label="Loading results"
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-lg border p-5">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export { EmptyState, ErrorState, LoadingState, CardGridSkeleton };
