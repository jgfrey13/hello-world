import { cn } from "@/lib/utils";

/** Standard page intro block for public pages. */
export function PageHeader({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h1>
      {description && (
        <p className="text-muted-foreground mt-3 text-base sm:text-lg">
          {description}
        </p>
      )}
      {children}
    </div>
  );
}
