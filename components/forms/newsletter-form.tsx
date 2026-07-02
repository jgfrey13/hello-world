"use client";

import * as React from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HoneypotField } from "@/components/forms/honeypot-field";
import { cn } from "@/lib/utils";
import {
  subscribeNewsletterAction,
  type NewsletterActionState,
} from "@/app/newsletter/actions";

const STATUS_TEXT: Record<
  Exclude<NewsletterActionState["status"], "idle">,
  string
> = {
  success: "You're subscribed — thanks! Unsubscribe anytime from any email.",
  invalid: "Enter a valid email address.",
  rate_limited: "Too many attempts — please wait a minute and try again.",
  error: "Something went wrong. Please try again.",
};

/**
 * Live newsletter signup: consent timestamp + source stored server-side,
 * duplicates idempotent, unsubscribed addresses re-consented. Campaigns
 * remain gated behind sender-domain auth (see docs/deployment.md).
 */
export function NewsletterForm({
  variant = "default",
}: {
  variant?: "default" | "footer";
}) {
  const [state, formAction, pending] = useActionState<
    NewsletterActionState,
    FormData
  >(subscribeNewsletterAction, { status: "idle" });
  const id = React.useId();
  const isFooter = variant === "footer";
  const isError = state.status !== "idle" && state.status !== "success";

  return (
    <form action={formAction} noValidate>
      <HoneypotField />
      <input
        type="hidden"
        name="consentSource"
        value={isFooter ? "site-footer" : "site"}
      />
      <Label
        htmlFor={`${id}-email`}
        className={cn(isFooter && "text-primary-foreground")}
      >
        Get the newsletter
      </Label>
      <div className="mt-1.5 flex gap-2">
        <Input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          aria-describedby={`${id}-status`}
          aria-invalid={isError || undefined}
          className={cn(isFooter && "bg-primary-foreground text-foreground")}
        />
        <Button
          type="submit"
          variant={isFooter ? "secondary" : "default"}
          disabled={pending}
        >
          {pending ? "Signing up…" : "Sign up"}
        </Button>
      </div>
      <p
        id={`${id}-status`}
        role="status"
        className={cn(
          "mt-1.5 min-h-5 text-xs",
          isError
            ? isFooter
              ? "text-primary-foreground font-medium"
              : "text-destructive"
            : isFooter
              ? "text-primary-foreground/80"
              : "text-muted-foreground",
        )}
      >
        {state.status === "idle"
          ? "No spam. Unsubscribe anytime. We only send it when it's worth reading."
          : STATUS_TEXT[state.status]}
      </p>
    </form>
  );
}
