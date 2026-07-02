import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/lib/database/types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

/** Shared field set for product create/edit forms. Classification is set
 * separately (admin-only lifecycle control), never through this form. */
export function ProductFormFields({
  product,
  brands,
  categories,
}: {
  product?: ProductRow;
  brands: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="p-brand">Brand</Label>
          <Select
            id="p-brand"
            name="brandId"
            required
            defaultValue={product?.brand_id ?? ""}
          >
            <option value="">Select…</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-category">Category</Label>
          <Select
            id="p-category"
            name="categoryId"
            defaultValue={product?.category_id ?? ""}
          >
            <option value="">None</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-name">Name</Label>
          <Input
            id="p-name"
            name="name"
            required
            defaultValue={product?.name}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-slug">Slug</Label>
          <Input
            id="p-slug"
            name="slug"
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            defaultValue={product?.slug}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-price">Price (USD)</Label>
          <Input
            id="p-price"
            name="priceAmount"
            type="number"
            step="0.01"
            min={0}
            defaultValue={product?.price_amount ?? ""}
          />
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              name="priceIsApproximate"
              defaultChecked={product?.price_is_approximate ?? true}
            />
            Approximate price
          </label>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-direct">Direct purchase URL</Label>
          <Input
            id="p-direct"
            name="directPurchaseUrl"
            type="url"
            defaultValue={product?.direct_purchase_url ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-affiliate">Affiliate URL</Label>
          <Input
            id="p-affiliate"
            name="affiliateUrl"
            type="url"
            defaultValue={product?.affiliate_url ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-network">Affiliate network</Label>
          <Input
            id="p-network"
            name="affiliateNetwork"
            defaultValue={product?.affiliate_network ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-mcity">Manufacturing city</Label>
          <Input
            id="p-mcity"
            name="manufacturingCity"
            defaultValue={product?.manufacturing_city ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-mstate">Manufacturing state</Label>
          <Input
            id="p-mstate"
            name="manufacturingState"
            defaultValue={product?.manufacturing_state ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-mcountry">Manufacturing country</Label>
          <Input
            id="p-mcountry"
            name="manufacturingCountry"
            defaultValue={product?.manufacturing_country ?? ""}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="p-summary">Summary (card text)</Label>
        <Textarea
          id="p-summary"
          name="summary"
          maxLength={500}
          defaultValue={product?.summary ?? ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="p-description">Description</Label>
        <Textarea
          id="p-description"
          name="description"
          rows={5}
          maxLength={10000}
          defaultValue={product?.description ?? ""}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="p-materials">Materials</Label>
          <Textarea
            id="p-materials"
            name="materials"
            maxLength={1000}
            defaultValue={product?.materials ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-imported">Imported-components note</Label>
          <Textarea
            id="p-imported"
            name="importedComponentsNote"
            maxLength={1000}
            defaultValue={product?.imported_components_note ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-warranty">Warranty summary</Label>
          <Textarea
            id="p-warranty"
            name="warrantySummary"
            maxLength={1000}
            defaultValue={product?.warranty_summary ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-shipping">Shipping summary</Label>
          <Textarea
            id="p-shipping"
            name="shippingSummary"
            maxLength={1000}
            defaultValue={product?.shipping_summary ?? ""}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isFeatured"
            defaultChecked={product?.is_featured}
          />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isSponsored"
            defaultChecked={product?.is_sponsored}
          />
          Sponsored placement (renders the Sponsored label)
        </label>
      </div>
    </div>
  );
}
