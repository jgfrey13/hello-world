import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupAction } from "@/app/auth/actions";

export const metadata: Metadata = {
  title: "Create an Account",
  robots: { index: false },
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <PageHeader
        title="Create an account"
        description="An account lets you claim a brand profile and track submissions. New accounts start with no special access — brand access is granted only after claim review."
      />

      <form action={signupAction} className="mt-8 space-y-5">
        {error && (
          <p
            role="alert"
            className="border-destructive/40 text-destructive rounded-md border px-4 py-3 text-sm"
          >
            {error}
          </p>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="signup-name">Full name</Label>
          <Input id="signup-name" name="fullName" autoComplete="name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="signup-password">Password</Label>
          <Input
            id="signup-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
          <p className="text-muted-foreground text-xs">
            At least 8 characters.
          </p>
        </div>
        <Button type="submit" className="w-full">
          Create account
        </Button>
        <p className="text-muted-foreground text-sm">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-foreground underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
