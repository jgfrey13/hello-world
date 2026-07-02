"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/**
 * Mobile filter drawer. Receives a complete server-rendered filter <form>
 * as children — the drawer is purely presentational, so filtering still
 * works as a normal GET submit.
 */
export function MobileFilters({ children }: { children: React.ReactNode }) {
  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button type="button" variant="outline" className="w-full">
            <SlidersHorizontal aria-hidden="true" />
            Filters &amp; sorting
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          aria-describedby={undefined}
          className="max-h-[85vh] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          {children}
        </SheetContent>
      </Sheet>
    </div>
  );
}
