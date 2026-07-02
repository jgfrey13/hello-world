import { Badge } from "@/components/ui/badge";

/**
 * Conspicuous sponsored label. Required on every paid placement — rendering
 * this component is not optional copy (see .claude/rules/frontend.md).
 */
export function SponsoredBadge({ className }: { className?: string }) {
  return (
    <Badge variant="accent" className={className}>
      Sponsored
    </Badge>
  );
}
