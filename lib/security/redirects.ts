/**
 * Only allow same-origin path redirects (e.g. after login). Rejects absolute
 * URLs, protocol-relative URLs, and anything that isn't a plain local path —
 * never redirect to arbitrary user-supplied destinations.
 */
export function safeLocalRedirect(target: unknown, fallback = "/"): string {
  if (typeof target !== "string") return fallback;
  if (
    !target.startsWith("/") ||
    target.startsWith("//") ||
    target.includes("\\")
  ) {
    return fallback;
  }
  return target;
}
