import { describe, expect, it } from "vitest";
import { articleHref, ARTICLE_TYPE_LABELS } from "@/lib/database/shapes";
import { articleJsonLd, articleMetadata } from "@/lib/seo/article";
import type { ArticleDetail } from "@/lib/database/articles";

function makeDetail(
  overrides: Partial<ArticleDetail["article"]> = {},
): ArticleDetail {
  return {
    article: {
      id: "a1",
      title: "Demo Guide",
      slug: "demo-guide",
      excerpt: "An excerpt.",
      body: "Body.",
      featured_image_path: null,
      article_type: "shopping_guide",
      author_id: null,
      status: "published",
      is_sponsored: false,
      sponsor_brand_id: null,
      affiliate_disclosure_required: true,
      seo_title: null,
      seo_description: null,
      is_demo: false,
      published_at: "2026-01-02T00:00:00Z",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-03T00:00:00Z",
      ...overrides,
    } as ArticleDetail["article"],
    authorName: "A. Writer",
    sponsorBrand: null,
    linkedBrands: [],
    linkedProducts: [],
    related: [],
  };
}

describe("articleHref", () => {
  it("routes shopping guides under /guides and everything else under /articles", () => {
    expect(articleHref({ slug: "x", articleType: "shopping_guide" })).toBe(
      "/guides/x",
    );
    expect(articleHref({ slug: "x", articleType: "founder_story" })).toBe(
      "/articles/x",
    );
    expect(articleHref({ slug: "x", articleType: "factory_story" })).toBe(
      "/articles/x",
    );
  });

  it("has a display label for every article type", () => {
    for (const type of [
      "shopping_guide",
      "brand_story",
      "founder_story",
      "factory_story",
      "comparison",
      "buying_guide",
      "news",
    ]) {
      expect(ARTICLE_TYPE_LABELS[type]).toBeTruthy();
    }
  });
});

describe("articleMetadata", () => {
  it("prefers editable SEO fields and sets the canonical", () => {
    const detail = makeDetail({
      seo_title: "SEO Title",
      seo_description: "SEO description",
    });
    const meta = articleMetadata(detail, "/guides/demo-guide");
    expect(meta.title).toBe("SEO Title");
    expect(meta.description).toBe("SEO description");
    expect(meta.alternates?.canonical).toBe("/guides/demo-guide");
    expect(meta.robots).toBeUndefined();
  });

  it("marks unpublished articles noindex", () => {
    const meta = articleMetadata(
      makeDetail({ status: "draft" }),
      "/guides/demo-guide",
    );
    expect(meta.robots).toEqual({ index: false });
  });
});

describe("articleJsonLd", () => {
  it("emits Article structured data with the author", () => {
    const parsed = JSON.parse(articleJsonLd(makeDetail()));
    expect(parsed["@type"]).toBe("Article");
    expect(parsed.headline).toBe("Demo Guide");
    expect(parsed.author).toEqual({ "@type": "Person", name: "A. Writer" });
    expect(parsed.sponsor).toBeUndefined();
  });

  it("discloses sponsorship in structured data", () => {
    const detail = makeDetail({ is_sponsored: true });
    detail.sponsorBrand = { name: "Sponsor Co", slug: "sponsor-co" };
    const parsed = JSON.parse(articleJsonLd(detail));
    expect(parsed.sponsor).toEqual({
      "@type": "Organization",
      name: "Sponsor Co",
    });
  });
});
