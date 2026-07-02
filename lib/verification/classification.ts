/**
 * Manufacturing classification enum — the canonical set from
 * docs/verification-methodology.md. The database stores these values;
 * the UI must always render the human-readable label.
 */
export const MANUFACTURING_CLASSIFICATIONS = [
  "verified_made_in_usa",
  "brand_reported_made_in_usa",
  "made_in_usa_imported_components",
  "assembled_in_usa",
  "certain_products_made_in_usa",
  "designed_in_usa_manufactured_elsewhere",
  "us_owned_unconfirmed_manufacturing",
  "unclear",
  "awaiting_review",
] as const;

export type ManufacturingClassification =
  (typeof MANUFACTURING_CLASSIFICATIONS)[number];

export const CLASSIFICATION_LABELS: Record<
  ManufacturingClassification,
  string
> = {
  verified_made_in_usa: "Verified Made in USA",
  brand_reported_made_in_usa: "Brand-Reported Made in USA",
  made_in_usa_imported_components: "Made in USA With Imported Components",
  assembled_in_usa: "Assembled in USA",
  certain_products_made_in_usa: "Selected Products Made in USA",
  designed_in_usa_manufactured_elsewhere:
    "Designed in USA; Manufactured Elsewhere",
  us_owned_unconfirmed_manufacturing: "U.S.-Owned; Manufacturing Unconfirmed",
  unclear: "Manufacturing Status Unclear",
  awaiting_review: "Awaiting Review",
};

/**
 * Visual weight per classification. Only evidence-verified domestic
 * manufacturing gets the primary (navy) treatment; weaker or unverified
 * statuses render progressively quieter so the UI never overstates a claim.
 */
export type ClassificationTone = "primary" | "secondary" | "outline" | "muted";

export const CLASSIFICATION_TONES: Record<
  ManufacturingClassification,
  ClassificationTone
> = {
  verified_made_in_usa: "primary",
  brand_reported_made_in_usa: "secondary",
  made_in_usa_imported_components: "secondary",
  assembled_in_usa: "secondary",
  certain_products_made_in_usa: "outline",
  designed_in_usa_manufactured_elsewhere: "outline",
  us_owned_unconfirmed_manufacturing: "outline",
  unclear: "muted",
  awaiting_review: "muted",
};

export function classificationLabel(
  value: ManufacturingClassification,
): string {
  return CLASSIFICATION_LABELS[value];
}
