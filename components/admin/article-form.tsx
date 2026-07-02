import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ARTICLE_TYPE_LABELS } from "@/lib/database/shapes";
import type { Database } from "@/lib/database/types";

type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];

/** Shared field set for article create/edit forms. */
export function ArticleFormFields({
  article,
  brands,
}: {
  article?: ArticleRow;
  brands: { id: string; name: string }[];
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="a-title">Title</Label>
          <Input
            id="a-title"
            name="title"
            required
            defaultValue={article?.title}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="a-slug">Slug</Label>
          <Input
            id="a-slug"
            name="slug"
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            defaultValue={article?.slug}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="a-type">Type</Label>
          <Select
            id="a-type"
            name="articleType"
            required
            defaultValue={article?.article_type ?? "shopping_guide"}
          >
            {Object.entries(ARTICLE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="a-excerpt">Excerpt</Label>
        <Textarea
          id="a-excerpt"
          name="excerpt"
          maxLength={500}
          defaultValue={article?.excerpt ?? ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="a-body">
          Body (plain text; blank line = new paragraph)
        </Label>
        <Textarea
          id="a-body"
          name="body"
          rows={12}
          defaultValue={article?.body ?? ""}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="a-seo-title">SEO title (optional)</Label>
          <Input
            id="a-seo-title"
            name="seoTitle"
            maxLength={200}
            defaultValue={article?.seo_title ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="a-seo-description">SEO description (optional)</Label>
          <Input
            id="a-seo-description"
            name="seoDescription"
            maxLength={300}
            defaultValue={article?.seo_description ?? ""}
          />
        </div>
      </div>
      <div className="space-y-3 rounded-lg border p-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isSponsored"
            defaultChecked={article?.is_sponsored}
          />
          Sponsored content (requires a sponsor and renders the disclosure)
        </label>
        <div className="space-y-1.5">
          <Label htmlFor="a-sponsor">Sponsor brand</Label>
          <Select
            id="a-sponsor"
            name="sponsorBrandId"
            defaultValue={article?.sponsor_brand_id ?? ""}
          >
            <option value="">None</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </Select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="affiliateDisclosureRequired"
            defaultChecked={article?.affiliate_disclosure_required ?? true}
          />
          Contains affiliate links (renders the affiliate disclosure)
        </label>
      </div>
    </div>
  );
}
