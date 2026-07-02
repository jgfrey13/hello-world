/**
 * Domain normalization for duplicate detection: two records pointing at the
 * same site should collide regardless of scheme, www, casing, or paths.
 */
export function normalizeDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(url)
    ? url
    : `https://${url}`;
  try {
    const host = new URL(candidate).hostname.toLowerCase();
    const bare = host.startsWith("www.") ? host.slice(4) : host;
    // Require a plausible registrable domain (URL parsing is permissive
    // with garbage; "ht!tp" parses as a hostname).
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(bare)) return null;
    return bare;
  } catch {
    return null;
  }
}
