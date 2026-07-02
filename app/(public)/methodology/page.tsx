import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { ManufacturingStatusBadge } from "@/components/ui/manufacturing-status-badge";
import {
  MANUFACTURING_CLASSIFICATIONS,
  classificationLabel,
} from "@/lib/verification/classification";

export const metadata: Metadata = {
  title: "Verification Methodology",
  description:
    "How MadeHere classifies manufacturing claims, what evidence we require, and what we never infer.",
};

const CLASSIFICATION_EXPLANATIONS: Record<string, string> = {
  verified_made_in_usa:
    "Domestic manufacturing supported by evidence our team has reviewed and approved.",
  brand_reported_made_in_usa:
    "The brand states the product is made in the USA; we have not yet independently corroborated it.",
  made_in_usa_imported_components:
    "Manufactured domestically, but contains imported materials or components — and we say so.",
  assembled_in_usa:
    "Final assembly happens in the United States; components may be sourced elsewhere.",
  certain_products_made_in_usa:
    "Only some of this brand's products are made domestically. We classify at the product level wherever possible.",
  designed_in_usa_manufactured_elsewhere:
    "Designed domestically, manufactured abroad. This is not 'Made in USA', and we never present it as such.",
  us_owned_unconfirmed_manufacturing:
    "The company is U.S.-owned, but we have not confirmed where its products are manufactured.",
  unclear:
    "Available information is conflicting or insufficient to classify honestly.",
  awaiting_review: "We haven't assessed this record yet.",
};

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <PageHeader
        title="How we verify manufacturing claims"
        description="MadeHere is an evidence-based editorial platform — not a certification body. Here is exactly what each status means and what we require before using it."
      />

      <section aria-labelledby="never-infer" className="mt-10">
        <h2 id="never-infer" className="font-serif text-2xl font-bold">
          What we never do
        </h2>
        <p className="text-muted-foreground mt-3">
          We never infer that a product is made in the United States because:
        </p>
        <ul className="text-muted-foreground mt-3 list-disc space-y-1.5 pl-6">
          <li>the company is headquartered in the United States,</li>
          <li>the founder is American or the company employs U.S. workers,</li>
          <li>
            the branding uses American imagery or contains “USA” or “America”,
          </li>
          <li>the product is “designed in America”, or</li>
          <li>
            the brand has <em>some</em> U.S.-made products.
          </li>
        </ul>
        <p className="text-muted-foreground mt-3">
          A paid subscription can never change a classification, guarantee
          verification, suppress an accurate correction, or buy a
          recommendation.
        </p>
      </section>

      <section aria-labelledby="classifications" className="mt-10">
        <h2 id="classifications" className="font-serif text-2xl font-bold">
          The classifications
        </h2>
        <dl className="mt-5 space-y-5">
          {MANUFACTURING_CLASSIFICATIONS.map((value) => (
            <div key={value} className="rounded-lg border p-4">
              <dt>
                <ManufacturingStatusBadge classification={value} />
                <span className="sr-only">{classificationLabel(value)}</span>
              </dt>
              <dd className="text-muted-foreground mt-2 text-sm">
                {CLASSIFICATION_EXPLANATIONS[value]}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="evidence" className="mt-10">
        <h2 id="evidence" className="font-serif text-2xl font-bold">
          What counts as evidence
        </h2>
        <p className="text-muted-foreground mt-3">
          Every classification links to evidence records: a source URL and
          title, an evidence note, the evidence type, the date we accessed it, a
          confidence score, and its human-review status. Evidence cannot be
          approved without a source. Each page shows its last-reviewed date, and
          anyone can{" "}
          <a href="/correction" className="underline underline-offset-4">
            submit a correction
          </a>
          .
        </p>
        <p className="text-muted-foreground mt-3">
          AI-assisted research is never itself treated as evidence — we store
          and cite the underlying sources.
        </p>
      </section>
    </div>
  );
}
