import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  /** Builds the href for a given page (keeps other query params). */
  hrefForPage: (page: number) => string;
  className?: string;
}

/** Server-friendly, link-based pagination (state lives in the URL). */
function Pagination({
  currentPage,
  totalPages,
  hrefForPage,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;
  const prev = currentPage > 1 ? currentPage - 1 : null;
  const next = currentPage < totalPages ? currentPage + 1 : null;

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-2", className)}
    >
      {prev ? (
        <Link
          href={hrefForPage(prev)}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <ChevronLeft aria-hidden="true" />
          Previous
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "pointer-events-none opacity-50",
          )}
        >
          <ChevronLeft aria-hidden="true" />
          Previous
        </span>
      )}
      <span className="text-muted-foreground px-2 text-sm">
        Page {currentPage} of {totalPages}
      </span>
      {next ? (
        <Link
          href={hrefForPage(next)}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Next
          <ChevronRight aria-hidden="true" />
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "pointer-events-none opacity-50",
          )}
        >
          Next
          <ChevronRight aria-hidden="true" />
        </span>
      )}
    </nav>
  );
}

export { Pagination };
