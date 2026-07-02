import { cn } from "@/lib/utils";

/**
 * Affiliate disclosure — must render near every purchase button/link.
 * A component, not incidental copy (see .claude/rules/frontend.md).
 */
export function AffiliateDisclosure({ className }: { className?: string }) {
  return (
    <p className={cn("text-muted-foreground text-xs", className)}>
      We may earn a commission when you buy through our links, at no extra cost
      to you. Commissions never influence classifications or recommendations.
    </p>
  );
}
