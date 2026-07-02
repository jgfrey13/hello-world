const MESSAGES: Record<string, { tone: "success" | "error"; message: string }> =
  {
    received: {
      tone: "success",
      message:
        "Thank you — we received your submission. Our team reviews every one; nothing is published automatically.",
    },
    duplicate: {
      tone: "error",
      message: "You already have a pending claim for this brand.",
    },
    invalid: {
      tone: "error",
      message:
        "Some fields were missing or invalid. Please check and try again.",
    },
    rate_limited: {
      tone: "error",
      message:
        "Too many submissions from your connection. Please wait a minute and try again.",
    },
    error: {
      tone: "error",
      message: "Something went wrong saving your submission. Please try again.",
    },
    saved: {
      tone: "success",
      message: "Saved.",
    },
    billing_success: {
      tone: "success",
      message:
        "Checkout complete. Your plan updates once payment confirmation arrives — refresh in a moment to see it.",
    },
    billing_canceled: {
      tone: "error",
      message: "Checkout canceled — no changes were made.",
    },
    billing_unconfigured: {
      tone: "error",
      message: "Billing isn't configured in this environment yet.",
    },
  };

/** Success/error banner for public form pages driven by ?status=. */
export function FormStatusBanner({ status }: { status?: string }) {
  const entry = status ? MESSAGES[status] : undefined;
  if (!entry) return null;
  return (
    <p
      role={entry.tone === "error" ? "alert" : "status"}
      className={
        entry.tone === "error"
          ? "border-destructive/40 text-destructive rounded-md border px-4 py-3 text-sm"
          : "bg-secondary rounded-md border px-4 py-3 text-sm"
      }
    >
      {entry.message}
    </p>
  );
}
