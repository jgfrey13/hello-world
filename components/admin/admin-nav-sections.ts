import type { AppRole } from "@/lib/auth";

export interface AdminNavSection {
  heading: string;
  links: { href: string; label: string; adminOnly?: boolean }[];
}

export const adminNavSections: AdminNavSection[] = [
  {
    heading: "Overview",
    links: [{ href: "/admin", label: "Dashboard" }],
  },
  {
    heading: "Catalog",
    links: [
      { href: "/admin/brands", label: "Brands" },
      { href: "/admin/products", label: "Products" },
      { href: "/admin/categories", label: "Categories" },
      { href: "/admin/articles", label: "Articles" },
    ],
  },
  {
    heading: "Review queues",
    links: [
      { href: "/admin/evidence", label: "Evidence" },
      { href: "/admin/claims", label: "Profile claims", adminOnly: true },
      {
        href: "/admin/submissions",
        label: "Brand submissions",
        adminOnly: true,
      },
      { href: "/admin/corrections", label: "Corrections", adminOnly: true },
      { href: "/admin/changes", label: "Proposed changes", adminOnly: true },
    ],
  },
  {
    heading: "Commercial",
    links: [
      { href: "/admin/sponsorships", label: "Sponsorships", adminOnly: true },
      { href: "/admin/newsletter", label: "Newsletter", adminOnly: true },
    ],
  },
  {
    heading: "Data",
    links: [
      { href: "/admin/import", label: "CSV import", adminOnly: true },
      { href: "/admin/research", label: "Research queue" },
    ],
  },
  {
    heading: "System",
    links: [{ href: "/admin/audit", label: "Audit log", adminOnly: true }],
  },
];

/** Sections with only the links the given role may see (empty ones dropped). */
export function sectionsForRole(role: AppRole): AdminNavSection[] {
  const isAdmin = role === "admin";
  return adminNavSections
    .map((section) => ({
      heading: section.heading,
      links: section.links.filter((link) => isAdmin || !link.adminOnly),
    }))
    .filter((section) => section.links.length > 0);
}
