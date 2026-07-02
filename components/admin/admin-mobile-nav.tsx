"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { AdminNavSection } from "@/components/admin/admin-nav-sections";

/**
 * Mobile admin navigation drawer. Receives role-filtered sections from the
 * server layout — the client never decides what a role may see.
 */
export function AdminMobileNav({ sections }: { sections: AdminNavSection[] }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="mb-6 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button type="button" variant="outline" className="w-full">
            <Menu aria-hidden="true" className="size-4" />
            Admin menu
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          aria-describedby={undefined}
          className="overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>Admin</SheetTitle>
          </SheetHeader>
          <nav aria-label="Admin" className="space-y-5">
            {sections.map((section) => (
              <div key={section.heading}>
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  {section.heading}
                </p>
                <ul className="mt-1.5 space-y-0.5">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="hover:bg-secondary block rounded-md px-2 py-2 text-sm"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
