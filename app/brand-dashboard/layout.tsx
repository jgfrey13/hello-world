import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: { default: "Brand Dashboard", template: "%s | MadeHere" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Brand-owner area. Requires sign-in; which brands are visible is decided by
 * brand_owners grants (RLS) — there is no role shortcut into other brands.
 */
export default async function BrandDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  return <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</div>;
}
