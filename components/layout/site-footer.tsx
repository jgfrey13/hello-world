import Link from "next/link";
import { footerLinkGroups } from "@/components/layout/nav-links";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import { Separator } from "@/components/ui/separator";

export function SiteFooter() {
  return (
    <footer className="bg-primary text-primary-foreground mt-16">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <p className="font-serif text-lg font-bold">MadeHere</p>
            <p className="text-primary-foreground/80 mt-2 text-sm">
              Research American-made brands, review sourcing evidence, and shop
              with greater confidence.
            </p>
            <div className="mt-4">
              <NewsletterForm variant="footer" />
            </div>
          </div>
          {footerLinkGroups.map((group) => (
            <nav key={group.heading} aria-label={group.heading}>
              <h2 className="text-sm font-semibold tracking-wide uppercase">
                {group.heading}
              </h2>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-primary-foreground/80 hover:text-primary-foreground text-sm underline-offset-4 hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <Separator className="bg-primary-foreground/20 my-8" />
        <div className="text-primary-foreground/70 space-y-2 text-xs">
          <p>
            MadeHere is an independent, evidence-based editorial platform. We
            are not a certification body. Manufacturing statuses reflect the
            evidence we have reviewed at the time noted on each page.
          </p>
          <p>
            Some links on this site are affiliate links; we may earn a
            commission on qualifying purchases. Paid placements are always
            labeled. Payment never influences classifications, verification
            decisions, or editorial recommendations.
          </p>
          <p>© {new Date().getFullYear()} MadeHere. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
