import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { DemoNotice } from "@/components/ui/demo-notice";
import { GuideCard } from "@/components/articles/guide-card";
import { AffiliateDisclosure } from "@/components/ui/affiliate-disclosure";
import { EmptyState } from "@/components/ui/states";
import { getPublishedArticles } from "@/lib/database/articles";

export const metadata: Metadata = {
  title: "Shopping Guides",
  description:
    "Editorial shopping guides for American-made products, with methodology and sourcing evidence.",
};

export const dynamic = "force-dynamic";

export default async function GuidesPage() {
  const guides = await getPublishedArticles({ type: "shopping_guide" });
  const stories = await getPublishedArticles({ limit: 6 });
  const otherStories = stories.filter(
    (article) => article.articleType !== "shopping_guide",
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader
        title="Shopping guides"
        description="Researched comparisons with clear selection methodology. Sponsored guides are always labeled."
      />
      <div className="mt-8 space-y-6">
        {(guides.some((g) => g.isDemo) ||
          otherStories.some((s) => s.isDemo)) && <DemoNotice />}
        <AffiliateDisclosure />
        {guides.length === 0 ? (
          <EmptyState
            title="No guides published yet"
            description="Shopping guides appear here as our editorial coverage grows."
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((guide) => (
              <GuideCard key={guide.id} guide={guide} />
            ))}
          </div>
        )}
        {otherStories.length > 0 && (
          <section aria-labelledby="guides-stories" className="pt-6">
            <h2 id="guides-stories" className="font-serif text-2xl font-bold">
              Founder &amp; factory stories
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {otherStories.map((story) => (
                <GuideCard key={story.id} guide={story} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
