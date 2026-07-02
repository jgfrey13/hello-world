import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/app/auth/actions";
import { safeLocalRedirect } from "@/lib/security/redirects";

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string; next?: string }>;
}) {
  const { error, notice, next } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <PageHeader
        title="Sign in"
        description="Brand owners and staff sign in here. Browsing MadeHere never requires an account."
      />

      <form action={loginAction} className="mt-8 space-y-5">
        <input type="hidden" name="next" value={safeLocalRedirect(next)} />
        {notice && (
          <p
            role="status"
            className="bg-secondary rounded-md border px-4 py-3 text-sm"
          >
            {notice}
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="border-destructive/40 text-destructive rounded-md border px-4 py-3 text-sm"
          >
            {error}
          </p>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="login-password">Password</Label>
          <Input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
          />
        </div>
        <Button type="submit" className="w-full">
          Sign in
        </Button>
        <p className="text-muted-foreground text-sm">
          No account?{" "}
          <Link
            href="/auth/signup"
            className="text-foreground underline underline-offset-4"
          >
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}
