import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database/types";
import { serverEnv } from "@/lib/security/env";

/**
 * Service-role client — BYPASSES RLS. Only for trusted server code:
 * Stripe webhooks, admin server actions, rate-limited public form inserts,
 * and analytics recording. Never import from anything reachable by the
 * client bundle ("server-only" enforces this at build time).
 */
export function createSupabaseServiceClient() {
  const env = serverEnv();
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
