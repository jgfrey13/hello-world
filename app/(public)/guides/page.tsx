import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { DemoNotice } from "@/components/ui/demo-notice";
import { GuideCard } from "@/components/articles/guide-card";
import { AffiliateDisclosure } from "@/components/ui/affiliate-disclosure";
import { demoGuides } from "@/lib/demo/content";

export const metadata: Metadata = {
  title: "Shopping Guides",
  description:
    "Editorial shopping guides for American-made products, with methodology and sourcing evidence.",
};

export default function GuidesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader
        title="Shopping guides"
        description="Researched comparisons with clear selection methodology. Sponsored guides are always labeled."
      />
      <div className="mt-8 space-y-6">
        <DemoNotice />
        <AffiliateDisclosure />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {demoGuides.map((guide) => (
            <GuideCard key={guide.slug} guide={guide} />
          ))}
        </div>
      </div>
    </div>
  );
}
