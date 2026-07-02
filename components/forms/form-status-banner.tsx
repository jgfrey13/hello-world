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
