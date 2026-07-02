import { Info } from "lucide-react";

/**
 * Shown on every surface rendering fictional demo content (rows flagged
 * is_demo). Demo data must always be clearly labeled; it is removed with
 * `npm run db:seed:remove`.
 */
export function DemoNotice() {
  return (
    <div
      role="note"
      className="bg-secondary text-secondary-foreground flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm"
    >
      <Info aria-hidden="true" className="size-4 shrink-0" />
      Fictional demonstration content — these brands and products do not exist.
    </div>
  );
}
