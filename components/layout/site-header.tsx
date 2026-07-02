import Link from "next/link";
import {
  primaryNavLinks,
  secondaryNavLinks,
} from "@/components/layout/nav-links";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button, buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { signOutAction } from "@/app/auth/actions";

export async function SiteHeader() {
  const current = await getCurrentUser();
  const role = current?.profile?.role;

  const accountLinks = current
    ? [
        ...(role === "editor" || role === "admin"
          ? [{ href: "/admin", label: "Admin" }]
          : []),
        { href: "/brand-dashboard", label: "Brand dashboard" },
      ]
    : [{ href: "/auth/login", label: "Sign in" }];

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
          {current ? (
            <>
              {accountLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  {link.label}
                </Link>
              ))}
              <form action={signOutAction}>
                <Button type="submit" variant="ghost" size="sm">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/pricing"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                For Brands
              </Link>
              <Link href="/submit" className={buttonVariants({ size: "sm" })}>
                Submit a Brand
              </Link>
            </>
          )}
        </div>
        <MobileNav
          links={[...primaryNavLinks, ...secondaryNavLinks, ...accountLinks]}
        />
      </div>
    </header>
  );
}
