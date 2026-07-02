import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | MadeHere Admin" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Admin area gate: editors and admins only. This server-side check is the
 * first layer; every mutating action re-checks its own required role, and
 * RLS enforces the same rules in the database.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const current = await requireRole("editor");

  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8 sm:px-6">
      <AdminNav role={current.profile?.role ?? "editor"} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
