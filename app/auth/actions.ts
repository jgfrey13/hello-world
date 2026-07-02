"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema } from "@/lib/validation";
import { safeLocalRedirect } from "@/lib/security/redirects";
import { publicEnv } from "@/lib/security/env";

function authRedirect(path: string, params: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  redirect(query ? `${path}?${query}` : path);
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const next = safeLocalRedirect(formData.get("next"));

  if (!parsed.success) {
    authRedirect("/auth/login", {
      error: "Enter a valid email and a password of at least 8 characters.",
      next,
    });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data!);
  if (error) {
    authRedirect("/auth/login", {
      error: "Sign-in failed. Check your email and password.",
      next,
    });
  }

  redirect(next);
}

export async function signupAction(formData: FormData) {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName") || undefined,
  });

  if (!parsed.success) {
    authRedirect("/auth/signup", {
      error: "Enter a valid email and a password of at least 8 characters.",
    });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data!.email,
    password: parsed.data!.password,
    options: {
      data: { full_name: parsed.data!.fullName },
      emailRedirectTo: `${publicEnv().NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    authRedirect("/auth/signup", {
      error: "Sign-up failed. Try again or use a different email address.",
    });
  }

  authRedirect("/auth/login", {
    notice: "Check your email to confirm your account, then sign in.",
  });
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
