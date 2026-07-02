import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/lib/database/types";

type BrandRow = Database["public"]["Tables"]["brands"]["Row"];

/** Shared field set for brand create/edit forms (submit button supplied by page). */
export function BrandFormFields({
  brand,
  categories,
  selectedCategoryIds = [],
  showAdminFlags = false,
}: {
  brand?: BrandRow;
  categories: { id: string; name: string }[];
  selectedCategoryIds?: string[];
  /** Placement flags are admin-only; hide them from editor forms. */
  showAdminFlags?: boolean;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="b-name">Name</Label>
          <Input id="b-name" name="name" required defaultValue={brand?.name} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="b-slug">Slug</Label>
          <Input
            id="b-slug"
            name="slug"
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            defaultValue={brand?.slug}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="b-legal">Legal name</Label>
          <Input
            id="b-legal"
            name="legalName"
            defaultValue={brand?.legal_name ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="b-website">Website</Label>
          <Input
            id="b-website"
            name="websiteUrl"
            type="url"
            defaultValue={brand?.website_url ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="b-city">HQ city</Label>
          <Input
            id="b-city"
            name="headquartersCity"
            defaultValue={brand?.headquarters_city ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="b-state">HQ state</Label>
          <Input
            id="b-state"
            name="headquartersState"
            defaultValue={brand?.headquarters_state ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="b-founded">Founded year</Label>
          <Input
            id="b-founded"
            name="foundedYear"
            type="number"
            min={1600}
            max={2100}
            defaultValue={brand?.founded_year ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="b-price">Price level</Label>
          <Select
            id="b-price"
            name="priceLevel"
            defaultValue={brand?.price_level ? String(brand.price_level) : ""}
          >
            <option value="">Unset</option>
            <option value="1">$ — budget</option>
            <option value="2">$$ — mid-range</option>
            <option value="3">$$$ — premium</option>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="b-founders">Founder names</Label>
        <Input
          id="b-founders"
          name="founderNames"
          defaultValue={brand?.founder_names ?? ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="b-summary">Summary (card text)</Label>
        <Textarea
          id="b-summary"
          name="summary"
          maxLength={500}
          defaultValue={brand?.summary ?? ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="b-description">Full description</Label>
        <Textarea
          id="b-description"
          name="fullDescription"
          rows={6}
          maxLength={10000}
          defaultValue={brand?.full_description ?? ""}
        />
      </div>
      <fieldset>
        <legend className="text-sm font-medium">Categories</legend>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
          {categories.map((category) => (
            <label
              key={category.id}
              className="flex items-center gap-2 text-sm"
            >
              <input
                type="checkbox"
                name="categoryIds"
                value={category.id}
                defaultChecked={selectedCategoryIds.includes(category.id)}
              />
              {category.name}
            </label>
          ))}
        </div>
      </fieldset>
      {showAdminFlags && (
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isFeatured"
              defaultChecked={brand?.is_featured}
            />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isSponsored"
              defaultChecked={brand?.is_sponsored}
            />
            Sponsored placement (renders the Sponsored label)
          </label>
        </div>
      )}
    </div>
  );
}
