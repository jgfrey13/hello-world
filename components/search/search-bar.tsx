import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Server-friendly search: a plain GET form whose state lives in the URL
 * (?q=…), so results are shareable and rendered server-side. Debounced
 * as-you-type enhancement can layer on top later without replacing this.
 */
export function SearchBar({
  action,
  placeholder = "Search American-made brands and products…",
  defaultValue,
  label = "Search",
  className,
}: {
  action: string;
  placeholder?: string;
  defaultValue?: string;
  label?: string;
  className?: string;
}) {
  return (
    <form action={action} role="search" className={cn("flex gap-2", className)}>
      <label htmlFor="site-search-q" className="sr-only">
        {label}
      </label>
      <Input
        id="site-search-q"
        type="search"
        name="q"
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="flex-1"
      />
      <Button type="submit">
        <Search aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">{label}</span>
      </Button>
    </form>
  );
}
