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
