import Link from "next/link";
import { SponsoredBadge } from "@/components/ui/sponsored-badge";

/**
 * Conspicuous sponsorship disclosure for editorial content. Required at the
 * top of every sponsored article — paid placement is never presented as
 * independent editorial (see .claude/rules/content-and-verification.md).
 */
export function SponsorDisclosure({
  sponsor,
}: {
  sponsor: { name: string; slug: string } | null;
}) {
  return (
    <div
      role="note"
      className="border-accent/40 bg-secondary flex flex-wrap items-center gap-2 rounded-md border px-4 py-3 text-sm"
    >
      <SponsoredBadge />
      <span>
        This content is sponsored
        {sponsor ? (
          <>
            {" "}
            by{" "}
            <Link
              href={`/brands/${sponsor.slug}`}
              className="font-medium underline underline-offset-4"
            >
              {sponsor.name}
            </Link>
          </>
        ) : null}
        . Sponsorship never influences manufacturing classifications or evidence
        review.
      </span>
    </div>
  );
}
