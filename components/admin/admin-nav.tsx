import Link from "next/link";
import type { AppRole } from "@/lib/auth";
import { sectionsForRole } from "@/components/admin/admin-nav-sections";

/** Desktop admin sidebar; the mobile drawer is AdminMobileNav. */
export function AdminNav({ role }: { role: AppRole }) {
  return (
    <nav aria-label="Admin" className="hidden w-48 shrink-0 md:block">
      <p className="font-serif text-lg font-bold">Admin</p>
      <div className="mt-4 space-y-5">
        {sectionsForRole(role).map((section) => (
          <div key={section.heading}>
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              {section.heading}
            </p>
            <ul className="mt-1.5 space-y-0.5">
              {section.links.map((link) => (
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
        ))}
      </div>
    </nav>
  );
}
