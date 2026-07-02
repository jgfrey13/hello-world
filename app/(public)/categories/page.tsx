import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { CategoryCard } from "@/components/categories/category-card";
import { EmptyState } from "@/components/ui/states";
import { getActiveCategories } from "@/lib/database/categories";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse American-made home and household products by category.",
};

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await getActiveCategories();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader
        title="Categories"
        description="We're launching with home and household products, expanding to more categories over time."
      />
      <div className="mt-8">
        {categories.length === 0 ? (
          <EmptyState
            title="No categories yet"
            description="Categories appear here as the directory grows."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
