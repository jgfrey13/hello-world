import { ExternalLink } from "lucide-react";
import { ManufacturingStatusBadge } from "@/components/ui/manufacturing-status-badge";
import type { EvidenceListItem } from "@/lib/database/shapes";

function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Public evidence list — approved records only (the public_evidence view
 * excludes unreviewed evidence and internal notes at the database layer).
 */
export function EvidencePanel({ evidence }: { evidence: EvidenceListItem[] }) {
  if (evidence.length === 0) {
    return (
      <p className="text-muted-foreground mt-3 text-sm">
        No approved evidence on file yet. Classifications remain at their
        weakest honest level until evidence is reviewed.
      </p>
    );
  }

  return (
    <ul className="mt-4 space-y-4">
      {evidence.map((item) => {
        const accessed = formatDate(item.accessedAt);
        const verified = formatDate(item.lastVerifiedAt);
        return (
          <li key={item.id} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <ManufacturingStatusBadge classification={item.classification} />
              <span className="text-muted-foreground text-xs capitalize">
                {item.evidenceType.replaceAll("_", " ")}
              </span>
            </div>
            {item.evidenceNote && (
              <p className="text-muted-foreground mt-2 text-sm">
                {item.evidenceNote}
              </p>
            )}
            <p className="mt-2 text-sm">
              {item.sourceUrl ? (
                <a
                  href={item.sourceUrl}
                  rel="nofollow noopener"
                  target="_blank"
                  className="inline-flex items-center gap-1 underline underline-offset-4"
                >
                  {item.sourceTitle ?? "Source"}
                  <ExternalLink aria-hidden="true" className="size-3.5" />
                </a>
              ) : (
                <span className="text-muted-foreground">
                  {item.sourceTitle}
                </span>
              )}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {accessed && <>Accessed {accessed}. </>}
              {verified && <>Last verified {verified}.</>}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
