import { Info } from "lucide-react";
import { DEMO_CONTENT_NOTICE } from "@/lib/demo/content";

/**
 * Shown on every surface rendering fictional demo content. Demo data must
 * always be clearly labeled and is removed when real records land.
 */
export function DemoNotice() {
  return (
    <div
      role="note"
      className="bg-secondary text-secondary-foreground flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm"
    >
      <Info aria-hidden="true" className="size-4 shrink-0" />
      {DEMO_CONTENT_NOTICE}
    </div>
  );
}
