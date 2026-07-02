import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database/types";

export type AppRole = Database["public"]["Enums"]["user_role"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/** The signed-in user's auth record + profile, or null when signed out. */
export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return { user, profile: profile ?? null };
}

const ROLE_RANK: Record<AppRole, number> = {
  visitor: 0,
  brand_owner: 1,
  editor: 2,
  admin: 3,
};

/**
 * Server-side authorization gate. Redirects to login when signed out and to
 * the homepage when the role is insufficient. This is a convenience for
 * pages/actions — RLS remains the hard boundary underneath.
 */
export async function requireRole(minimum: AppRole) {
  const current = await getCurrentUser();
  if (!current) redirect("/auth/login");
  const role = current.profile?.role ?? "visitor";
  if (ROLE_RANK[role] < ROLE_RANK[minimum]) redirect("/");
  return current;
}

export async function requireUser() {
  const current = await getCurrentUser();
  if (!current) redirect("/auth/login");
  return current;
}
