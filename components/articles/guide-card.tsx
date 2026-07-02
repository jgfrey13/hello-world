import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SponsoredBadge } from "@/components/ui/sponsored-badge";
import type { ArticleListItem } from "@/lib/database/shapes";

export function GuideCard({ guide }: { guide: ArticleListItem }) {
  return (
    <Card className="h-full transition-shadow hover:shadow-sm">
      <CardHeader>
        {guide.isSponsored && (
          <div>
            <SponsoredBadge />
          </div>
        )}
        <CardTitle>
          <Link
            href={`/guides/${guide.slug}`}
            className="hover:underline focus-visible:underline"
          >
            {guide.title}
          </Link>
        </CardTitle>
        {guide.excerpt && <CardDescription>{guide.excerpt}</CardDescription>}
      </CardHeader>
    </Card>
  );
}
