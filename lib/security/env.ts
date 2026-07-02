import { z } from "zod";

/**
 * Environment validation — fail fast on missing/malformed configuration.
 * Server-only secrets live in serverEnvSchema and must never be imported
 * into client components (this module is server-only by convention; the
 * service-role key never reaches the browser bundle because only server
 * code imports serverEnv).
 */

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // Billing/email are optional config: absent vars disable the feature
  // honestly rather than failing the whole app.
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  STRIPE_PRICE_VERIFIED: z.string().min(1).optional(),
  STRIPE_PRICE_FEATURED: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
}

let cachedServerEnv: ServerEnv | null = null;

/** Validated server environment. Throws (fails fast) when misconfigured. */
export function serverEnv(): ServerEnv {
  if (cachedServerEnv) return cachedServerEnv;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid server environment: ${formatIssues(parsed.error)}`,
    );
  }
  cachedServerEnv = parsed.data;
  return parsed.data;
}

/** Validated public environment (safe for the client bundle). */
export function publicEnv(): PublicEnv {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (!parsed.success) {
    throw new Error(
      `Invalid public environment: ${formatIssues(parsed.error)}`,
    );
  }
  return parsed.data;
}

export { publicEnvSchema, serverEnvSchema };
