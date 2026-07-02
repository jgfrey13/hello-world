"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "unavailable" };

/**
 * Newsletter signup UI. Client-side validation only in Phase 1; the storage
 * backend (consent record, duplicate handling) lands in Phase 8 — until then
 * submission reports honestly that signup is not yet active. Do not wire this
 * to a fake success state.
 */
export function NewsletterForm({
  variant = "default",
}: {
  variant?: "default" | "footer";
}) {
  const [state, setState] = React.useState<FormState>({ status: "idle" });
  const id = React.useId();
  const isFooter = variant === "footer";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = new FormData(form).get("email");
    if (
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      setState({ status: "error", message: "Enter a valid email address." });
      return;
    }
    // Phase 8 wires this to the server action that stores consent.
    setState({ status: "unavailable" });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
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
          aria-invalid={state.status === "error" || undefined}
          className={cn(isFooter && "bg-primary-foreground text-foreground")}
        />
        <Button type="submit" variant={isFooter ? "secondary" : "default"}>
          Sign up
        </Button>
      </div>
      <p
        id={`${id}-status`}
        role="status"
        className={cn(
          "mt-1.5 min-h-5 text-xs",
          state.status === "error"
            ? isFooter
              ? "text-primary-foreground font-medium"
              : "text-destructive"
            : isFooter
              ? "text-primary-foreground/80"
              : "text-muted-foreground",
        )}
      >
        {state.status === "error" && state.message}
        {state.status === "unavailable" &&
          "Newsletter signup isn't active yet — it launches with our notifications phase."}
        {state.status === "idle" &&
          "No spam. Unsubscribe anytime. We only send it when it's worth reading."}
      </p>
    </form>
  );
}
