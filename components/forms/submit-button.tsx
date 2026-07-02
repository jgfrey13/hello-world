"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

/**
 * Submit button with a pending state for server-action forms: disables while
 * the action runs (prevents double submission — critical for checkout) and
 * announces progress.
 */
export function SubmitButton({
  children,
  pendingLabel = "Working…",
  ...props
}: ButtonProps & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
