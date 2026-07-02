import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Indicates evidence-reviewed status. This is an evidence outcome — it is
 * never granted by a subscription tier and must not be conflated with the
 * paid "Verified" plan.
 */
export function VerificationBadge({ className }: { className?: string }) {
  return (
    <Badge variant="default" className={className}>
      <BadgeCheck aria-hidden="true" className="size-3.5" />
      Evidence reviewed
    </Badge>
  );
}
