import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { getOwnedBrands } from "@/lib/database/owner";

export default async function BrandDashboardPage() {
  const brands = await getOwnedBrands();

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold">Brand dashboard</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Manage the brands you have been approved for. Edits and new products go
        to our review team; manufacturing classifications always follow the
        evidence.
      </p>

      {brands.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No brands yet"
            description="You don't have management access to any brand. Claim a profile and our team will review your affiliation."
            action={
              <Link href="/claim" className={buttonVariants()}>
                Claim a brand profile
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {brands.map((brand) => (
            <Link key={brand.id} href={`/brand-dashboard/brands/${brand.id}`}>
              <Card className="h-full transition-shadow hover:shadow-sm">
                <CardHeader>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={
                        brand.status === "published" ? "default" : "muted"
                      }
                    >
                      {brand.status}
                    </Badge>
                    <Badge variant="secondary">{brand.subscriptionTier}</Badge>
                  </div>
                  <CardTitle>{brand.name}</CardTitle>
                  <CardDescription>
                    Manage profile, products, and analytics
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
