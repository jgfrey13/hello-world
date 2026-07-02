import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ManufacturingStatusBadge } from "@/components/ui/manufacturing-status-badge";
import { SponsoredBadge } from "@/components/ui/sponsored-badge";
import type { DemoProduct } from "@/lib/demo/content";

export function ProductCard({ product }: { product: DemoProduct }) {
  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-sm">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <ManufacturingStatusBadge classification={product.classification} />
          {product.isSponsored && <SponsoredBadge />}
        </div>
        <CardTitle>
          <Link
            href={`/products/${product.slug}`}
            className="hover:underline focus-visible:underline"
          >
            {product.name}
          </Link>
        </CardTitle>
        <CardDescription>
          by{" "}
          <Link
            href={`/brands/${product.brandSlug}`}
            className="underline-offset-4 hover:underline"
          >
            {product.brandName}
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto">
        <p className="text-muted-foreground text-sm">{product.summary}</p>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="font-medium">{product.priceDisplay}</span>
          <span className="text-muted-foreground">{product.category}</span>
        </div>
      </CardContent>
    </Card>
  );
}
