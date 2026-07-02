import Link from "next/link";
import type { AppRole } from "@/lib/auth";

const sections: {
  heading: string;
  links: { href: string; label: string; adminOnly?: boolean }[];
}[] = [
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
    heading: "System",
    links: [{ href: "/admin/audit", label: "Audit log", adminOnly: true }],
  },
];

export function AdminNav({ role }: { role: AppRole }) {
  const isAdmin = role === "admin";
  return (
    <nav aria-label="Admin" className="hidden w-48 shrink-0 md:block">
      <p className="font-serif text-lg font-bold">Admin</p>
      <div className="mt-4 space-y-5">
        {sections.map((section) => {
          const links = section.links.filter(
            (link) => isAdmin || !link.adminOnly,
          );
          if (links.length === 0) return null;
          return (
            <div key={section.heading}>
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                {section.heading}
              </p>
              <ul className="mt-1.5 space-y-0.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="hover:bg-secondary block rounded-md px-2 py-1.5 text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
