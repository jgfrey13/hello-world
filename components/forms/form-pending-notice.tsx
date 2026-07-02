import { Info } from "lucide-react";

/**
 * Honest state for form shells whose backend lands in a later phase.
 * Rendered instead of a submit button — never fake a success path.
 */
export function FormPendingNotice({ activates }: { activates: string }) {
  return (
    <div
      role="note"
      className="bg-secondary flex items-start gap-2 rounded-md border px-4 py-3 text-sm"
    >
      <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <p>
        This form isn’t accepting submissions yet — it activates with{" "}
        {activates}. The preview below shows the information we’ll ask for.
      </p>
    </div>
  );
}
