import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CategoryListItem } from "@/lib/database/shapes";

export function CategoryCard({ category }: { category: CategoryListItem }) {
  return (
    <Card className="h-full transition-shadow hover:shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <Link
            href={`/categories/${category.slug}`}
            className="hover:underline focus-visible:underline"
          >
            {category.name}
          </Link>
          <ArrowRight
            aria-hidden="true"
            className="text-muted-foreground size-4"
          />
        </CardTitle>
        {category.description && (
          <CardDescription>{category.description}</CardDescription>
        )}
      </CardHeader>
    </Card>
  );
}
