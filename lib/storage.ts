/**
 * Public URL for an object in the public brand-media bucket. Pure string
 * construction (Supabase's stable public-object URL scheme), safe for both
 * server and client components.
 */
export function brandMediaUrl(path: string | null): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/brand-media/${path}`;
}
