import Link from "next/link";
import { MapPin } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ManufacturingStatusBadge } from "@/components/ui/manufacturing-status-badge";
import { SponsoredBadge } from "@/components/ui/sponsored-badge";
import type { DemoBrand } from "@/lib/demo/content";

export function BrandCard({ brand }: { brand: DemoBrand }) {
  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-sm">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <ManufacturingStatusBadge classification={brand.classification} />
          {brand.isSponsored && <SponsoredBadge />}
        </div>
        <CardTitle>
          <Link
            href={`/brands/${brand.slug}`}
            className="hover:underline focus-visible:underline"
          >
            {brand.name}
          </Link>
        </CardTitle>
        <CardDescription>{brand.summary}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto">
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-1">
            <MapPin aria-hidden="true" className="size-3.5" />
            {brand.state}
          </span>
          <span aria-hidden="true">
            {"$".repeat(brand.priceLevel)}
            <span className="opacity-30">
              {"$".repeat(3 - brand.priceLevel)}
            </span>
          </span>
          <span className="sr-only">Price level {brand.priceLevel} of 3</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {brand.categories.map((category) => (
            <Badge key={category} variant="muted">
              {category}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
