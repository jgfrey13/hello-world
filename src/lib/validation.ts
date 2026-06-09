import { z } from 'zod';

// Strip non-printable control characters (keeping tab \x09, newline \x0A and
// carriage-return \x0D) from free text to mitigate stored XSS / injection.
// React additionally HTML-escapes everything at render time — defense-in-depth.
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const clean = (s: string) => s.replace(CONTROL_CHARS, '').trim();

const safeText = (max: number) =>
  z
    .string()
    .transform(clean)
    .pipe(z.string().min(1).max(max));

const optionalText = (max: number) =>
  z
    .string()
    .transform(clean)
    .pipe(z.string().max(max))
    .optional()
    .or(z.literal('').transform(() => undefined));

export const CATEGORIES = [
  'PLUMBING',
  'HVAC',
  'ROOFING',
  'ELECTRICAL',
  'PAINTING',
  'LANDSCAPING',
  'CARPENTRY',
  'FLOORING',
  'REMODELING',
  'GENERAL',
] as const;

export const URGENCIES = ['EMERGENCY', 'WITHIN_WEEK', 'WITHIN_MONTH', 'FLEXIBLE'] as const;

// --- Auth ---------------------------------------------------------------------

export const registerSchema = z.object({
  email: z.string().email().max(255).toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  role: z.enum(['HOMEOWNER', 'CONTRACTOR']),
  name: safeText(120),
  // Contractor-only (validated further server-side)
  businessName: optionalText(160),
  licenseNum: optionalText(80),
  serviceRadiusMiles: z.coerce.number().int().min(1).max(500).optional(),
  city: optionalText(120),
  zip: optionalText(12),
});

export const loginSchema = z.object({
  email: z.string().email().max(255).toLowerCase(),
  password: z.string().min(1).max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().max(255).toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10).max(200),
  password: z.string().min(8).max(128),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(10).max(200),
});

// --- Profile ------------------------------------------------------------------

export const updateProfileSchema = z.object({
  name: safeText(120).optional(),
  businessName: optionalText(160),
  licenseNum: optionalText(80),
  bio: optionalText(2000),
  serviceRadiusMiles: z.coerce.number().int().min(1).max(500).optional(),
  categories: z.array(z.enum(CATEGORIES)).max(10).optional(),
  city: optionalText(120),
  zip: optionalText(12),
});

// --- Projects -----------------------------------------------------------------

export const createProjectSchema = z
  .object({
    title: safeText(160),
    description: safeText(5000),
    category: z.enum(CATEGORIES),
    urgency: z.enum(URGENCIES).default('FLEXIBLE'),
    requestQuotes: z.coerce.boolean().default(false),
    budgetMin: z.coerce.number().int().min(0).max(10_000_000).optional(),
    budgetMax: z.coerce.number().int().min(0).max(10_000_000).optional(),
    city: safeText(120),
    zip: z
      .string()
      .trim()
      .regex(/^\d{5}(-\d{4})?$/, 'Enter a valid ZIP code'),
  })
  .refine(
    (d) => d.requestQuotes || d.budgetMin !== undefined || d.budgetMax !== undefined,
    { message: 'Provide a budget range or select "Request quotes".', path: ['budgetMin'] },
  )
  .refine(
    (d) => d.budgetMin === undefined || d.budgetMax === undefined || d.budgetMax >= d.budgetMin,
    { message: 'Maximum budget must be greater than minimum.', path: ['budgetMax'] },
  );

export const projectFilterSchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  zip: z
    .string()
    .trim()
    .regex(/^\d{5}$/)
    .optional(),
  budgetMin: z.coerce.number().int().min(0).optional(),
  budgetMax: z.coerce.number().int().min(0).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  q: optionalText(120),
  page: z.coerce.number().int().min(1).default(1),
});

// --- Bids ---------------------------------------------------------------------

export const createBidSchema = z
  .object({
    amount: z.coerce.number().positive().max(10_000_000), // dollars
    startDate: z.coerce.date(),
    completionDate: z.coerce.date(),
    proposalText: safeText(3000),
  })
  .refine((d) => d.completionDate >= d.startDate, {
    message: 'Completion date must be after the start date.',
    path: ['completionDate'],
  });

// --- Messages -----------------------------------------------------------------

export const createMessageSchema = z.object({
  body: safeText(2000),
  attachmentUrl: z.string().url().max(1000).optional(),
});

// --- Reviews ------------------------------------------------------------------

export const createReviewSchema = z.object({
  projectId: z.string().min(1).max(64),
  rating: z.coerce.number().int().min(1).max(5),
  comment: optionalText(2000),
});
