import { z } from "zod";

/**
 * Shared Zod schemas — one per entity, reused by forms, server actions, and
 * route handlers (see .claude/rules/architecture.md). Add schemas here as
 * entities gain write paths; never duplicate validation inline.
 */

const trimmedString = (max: number) => z.string().trim().min(1).max(max);

export const emailSchema = z.string().trim().toLowerCase().email().max(320);

const httpUrlSchema = z
  .string()
  .trim()
  .url()
  .max(2048)
  .refine(
    (value) => value.startsWith("https://") || value.startsWith("http://"),
    {
      message: "Must be an http(s) URL",
    },
  );

export const newsletterSignupSchema = z.object({
  email: emailSchema,
  firstName: trimmedString(100).optional(),
  consentSource: trimmedString(100).default("site"),
});
export type NewsletterSignupInput = z.infer<typeof newsletterSignupSchema>;

export const brandSubmissionSchema = z.object({
  brandName: trimmedString(200),
  websiteUrl: httpUrlSchema,
  submitterName: trimmedString(200),
  submitterEmail: emailSchema,
  relationshipToBrand: trimmedString(100).optional(),
  categories: z.array(trimmedString(100)).max(10).optional(),
  description: trimmedString(5000).optional(),
  manufacturingInformation: trimmedString(5000).optional(),
  evidenceUrl: httpUrlSchema.optional(),
  comments: trimmedString(5000).optional(),
});
export type BrandSubmissionInput = z.infer<typeof brandSubmissionSchema>;

export const correctionSchema = z.object({
  pageUrl: httpUrlSchema,
  issueDescription: trimmedString(5000),
  proposedCorrection: trimmedString(5000).optional(),
  supportingSourceUrl: httpUrlSchema.optional(),
  submitterEmail: emailSchema,
  brandId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
});
export type CorrectionInput = z.infer<typeof correctionSchema>;

export const brandClaimSchema = z.object({
  brandId: z.string().uuid(),
  applicantName: trimmedString(200),
  companyEmail: emailSchema,
  jobTitle: trimmedString(200).optional(),
  comments: trimmedString(5000).optional(),
});
export type BrandClaimInput = z.infer<typeof brandClaimSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(200),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = loginSchema.extend({
  fullName: trimmedString(200).optional(),
});
export type SignupInput = z.infer<typeof signupSchema>;

// ---------------------------------------------------------------------------
// Admin CRUD schemas (Phase 5)
// ---------------------------------------------------------------------------

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers, hyphens")
  .max(200);

const optionalTrimmed = (max: number) =>
  z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    trimmedString(max).optional(),
  );

const optionalUrl = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().trim().url().max(2048).optional(),
);

const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

const optionalInt = (min: number, max: number) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(min).max(max).optional(),
  );

const optionalMoney = (max: number) =>
  z.preprocess(emptyToUndefined, z.coerce.number().min(0).max(max).optional());

const checkbox = z.preprocess(
  (value) => value === "on" || value === true,
  z.boolean(),
);

export const brandUpsertSchema = z.object({
  name: trimmedString(200),
  slug: slugSchema,
  legalName: optionalTrimmed(200),
  summary: optionalTrimmed(500),
  fullDescription: optionalTrimmed(10000),
  websiteUrl: optionalUrl,
  foundedYear: optionalInt(1600, 2100),
  founderNames: optionalTrimmed(500),
  headquartersCity: optionalTrimmed(120),
  headquartersState: optionalTrimmed(120),
  priceLevel: optionalInt(1, 3),
  isFeatured: checkbox,
  isSponsored: checkbox,
});
export type BrandUpsertInput = z.infer<typeof brandUpsertSchema>;

export const productUpsertSchema = z.object({
  brandId: z.string().uuid(),
  categoryId: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.string().uuid().optional(),
  ),
  name: trimmedString(200),
  slug: slugSchema,
  summary: optionalTrimmed(500),
  description: optionalTrimmed(10000),
  priceAmount: optionalMoney(1000000),
  priceIsApproximate: checkbox,
  directPurchaseUrl: optionalUrl,
  affiliateUrl: optionalUrl,
  affiliateNetwork: optionalTrimmed(120),
  manufacturingCity: optionalTrimmed(120),
  manufacturingState: optionalTrimmed(120),
  manufacturingCountry: optionalTrimmed(120),
  materials: optionalTrimmed(1000),
  importedComponentsNote: optionalTrimmed(1000),
  warrantySummary: optionalTrimmed(1000),
  shippingSummary: optionalTrimmed(1000),
  isFeatured: checkbox,
  isSponsored: checkbox,
});
export type ProductUpsertInput = z.infer<typeof productUpsertSchema>;

export const categoryUpsertSchema = z.object({
  name: trimmedString(120),
  slug: slugSchema,
  description: optionalTrimmed(500),
  displayOrder: optionalInt(0, 10000),
  isActive: checkbox,
});
export type CategoryUpsertInput = z.infer<typeof categoryUpsertSchema>;

export const articleUpsertSchema = z.object({
  title: trimmedString(300),
  slug: slugSchema,
  excerpt: optionalTrimmed(500),
  body: optionalTrimmed(100000),
  articleType: z.enum([
    "shopping_guide",
    "brand_story",
    "founder_story",
    "factory_story",
    "comparison",
    "buying_guide",
    "news",
  ]),
  isSponsored: checkbox,
  sponsorBrandId: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.string().uuid().optional(),
  ),
  affiliateDisclosureRequired: checkbox,
  seoTitle: optionalTrimmed(200),
  seoDescription: optionalTrimmed(300),
});
export type ArticleUpsertInput = z.infer<typeof articleUpsertSchema>;

export const evidenceUpsertSchema = z.object({
  brandId: z.string().uuid(),
  productId: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.string().uuid().optional(),
  ),
  classification: z.enum([
    "verified_made_in_usa",
    "brand_reported_made_in_usa",
    "made_in_usa_imported_components",
    "assembled_in_usa",
    "certain_products_made_in_usa",
    "designed_in_usa_manufactured_elsewhere",
    "us_owned_unconfirmed_manufacturing",
    "unclear",
    "awaiting_review",
  ]),
  sourceUrl: optionalUrl,
  sourceTitle: optionalTrimmed(300),
  evidenceNote: optionalTrimmed(5000),
  evidenceType: z.enum([
    "brand_statement",
    "product_page",
    "factory_documentation",
    "press_coverage",
    "regulatory_filing",
    "third_party_audit",
    "direct_correspondence",
    "other",
  ]),
  confidenceScore: optionalInt(0, 100),
  internalNotes: optionalTrimmed(5000),
});
export type EvidenceUpsertInput = z.infer<typeof evidenceUpsertSchema>;

export const sponsorshipUpsertSchema = z.object({
  brandId: z.string().uuid(),
  placementType: trimmedString(120),
  placementLocation: optionalTrimmed(200),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  ),
  disclosureText: optionalTrimmed(500),
  amount: optionalMoney(10000000),
});
export type SponsorshipUpsertInput = z.infer<typeof sponsorshipUpsertSchema>;

// ---------------------------------------------------------------------------
// Proposed-change payloads (Phase 6)
// Shared by the brand-owner submission forms AND the admin apply step, so a
// proposal that validates on submit is guaranteed applyable on approval.
// Strict schemas: classification/status/evidence/billing keys are rejected.
// ---------------------------------------------------------------------------

export const proposedBrandChangeSchema = z
  .object({
    summary: z.string().trim().min(1).max(500).optional(),
    full_description: z.string().trim().min(1).max(10000).optional(),
    website_url: z.string().trim().url().max(2048).optional(),
    founder_names: z.string().trim().min(1).max(500).optional(),
    founded_year: z.coerce.number().int().min(1600).max(2100).optional(),
    headquarters_city: z.string().trim().min(1).max(120).optional(),
    headquarters_state: z.string().trim().min(1).max(120).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Propose at least one change",
  });
export type ProposedBrandChange = z.infer<typeof proposedBrandChangeSchema>;

export const proposedProductChangeSchema = z
  .object({
    summary: z.string().trim().min(1).max(500).optional(),
    description: z.string().trim().min(1).max(10000).optional(),
    materials: z.string().trim().min(1).max(1000).optional(),
    warranty_summary: z.string().trim().min(1).max(1000).optional(),
    shipping_summary: z.string().trim().min(1).max(1000).optional(),
    direct_purchase_url: z.string().trim().url().max(2048).optional(),
    price_amount: z.coerce.number().min(0).max(1000000).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Propose at least one change",
  });
export type ProposedProductChange = z.infer<typeof proposedProductChangeSchema>;

/** Owner-proposed NEW product: descriptive fields only. It is created as a
 * draft with classification 'awaiting_review' — never with a claim. */
export const proposedNewProductSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    summary: z.string().trim().min(1).max(500).optional(),
    description: z.string().trim().min(1).max(10000).optional(),
    materials: z.string().trim().min(1).max(1000).optional(),
    price_amount: z.coerce.number().min(0).max(1000000).optional(),
    direct_purchase_url: z.string().trim().url().max(2048).optional(),
  })
  .strict();
export type ProposedNewProduct = z.infer<typeof proposedNewProductSchema>;
