import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { DemoNotice } from "@/components/ui/demo-notice";
import { CategoryCard } from "@/components/categories/category-card";
import { demoCategories } from "@/lib/demo/content";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse American-made home and household products by category.",
};

export default function CategoriesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader
        title="Categories"
        description="We're launching with home and household products, expanding to more categories over time."
      />
      <div className="mt-8 space-y-6">
        <DemoNotice />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {demoCategories.map((category) => (
            <CategoryCard key={category.slug} category={category} />
          ))}
        </div>
      </div>
    </div>
  );
}
