/**
 * Defense-in-depth for rendering stored URLs as hrefs: even though write
 * paths enforce http(s), never emit a stored value into an href unless it
 * still parses as http(s) — a bad row must not become executable.
 */
export function safeHttpUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:"
      ? url
      : null;
  } catch {
    return null;
  }
}
