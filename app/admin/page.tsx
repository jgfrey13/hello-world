import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAdminMetrics } from "@/lib/database/admin";

function Metric({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href?: string;
}) {
  const body = (
    <Card className={href ? "transition-shadow hover:shadow-sm" : undefined}>
      <CardHeader>
        <CardTitle className="font-sans text-3xl">{value}</CardTitle>
        <CardDescription>{label}</CardDescription>
      </CardHeader>
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default async function AdminDashboardPage() {
  const m = await getAdminMetrics();

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Live counts from the database.
      </p>

      <h2 className="mt-8 font-serif text-lg font-semibold">Needs review</h2>
      <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric
          label="Pending evidence"
          value={m.pendingEvidence}
          href="/admin/evidence"
        />
        <Metric
          label="Profile claims"
          value={m.pendingClaims}
          href="/admin/claims"
        />
        <Metric
          label="Brand submissions"
          value={m.pendingSubmissions}
          href="/admin/submissions"
        />
        <Metric
          label="Corrections"
          value={m.pendingCorrections}
          href="/admin/corrections"
        />
        <Metric
          label="Proposed changes"
          value={m.pendingChanges}
          href="/admin/changes"
        />
        <Metric
          label="Draft/pending brands"
          value={m.pendingBrands}
          href="/admin/brands?status=draft"
        />
        <Metric
          label="Draft/pending products"
          value={m.pendingProducts}
          href="/admin/products?status=draft"
        />
      </div>

      <h2 className="mt-8 font-serif text-lg font-semibold">Directory</h2>
      <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric
          label="Published brands"
          value={m.publishedBrands}
          href="/admin/brands"
        />
        <Metric
          label="Published products"
          value={m.publishedProducts}
          href="/admin/products"
        />
        <Metric label="Paying brands" value={m.payingBrands} />
        <Metric
          label="Newsletter subscribers"
          value={m.newsletterSubscribers}
          href="/admin/newsletter"
        />
        <Metric label="Affiliate clicks (30d)" value={m.affiliateClicks30d} />
      </div>

      <p className="text-muted-foreground mt-8 text-xs">
        Affiliate click tracking activates with the redirect phase; the count
        above reads the real table and stays at zero until then.
      </p>
    </div>
  );
}
