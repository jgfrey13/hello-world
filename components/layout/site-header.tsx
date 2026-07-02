import Link from "next/link";
import {
  primaryNavLinks,
  secondaryNavLinks,
} from "@/components/layout/nav-links";
import { MobileNav } from "@/components/layout/mobile-nav";
import { buttonVariants } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="bg-background/95 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="font-serif text-xl font-bold tracking-tight"
          aria-label="MadeHere home"
        >
          MadeHere
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {primaryNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:bg-secondary rounded-md px-3 py-2 text-sm font-medium"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/pricing"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            For Brands
          </Link>
          <Link href="/submit" className={buttonVariants({ size: "sm" })}>
            Submit a Brand
          </Link>
        </div>
        <MobileNav links={[...primaryNavLinks, ...secondaryNavLinks]} />
      </div>
    </header>
  );
}
