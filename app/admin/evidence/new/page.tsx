import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CLASSIFICATION_LABELS,
  MANUFACTURING_CLASSIFICATIONS,
} from "@/lib/verification/classification";
import { createEvidenceAction } from "@/app/admin/evidence/actions";

export const metadata = { title: "Add Evidence" };

const EVIDENCE_TYPES = [
  "brand_statement",
  "product_page",
  "factory_documentation",
  "press_coverage",
  "regulatory_filing",
  "third_party_audit",
  "direct_correspondence",
  "other",
] as const;

export default async function NewEvidencePage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: brands }, { data: products }] = await Promise.all([
    supabase.from("brands").select("id, name").order("name"),
    supabase.from("products").select("id, name, brand_id").order("name"),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl font-bold">Add evidence</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        New records start pending; approval is a separate admin decision and
        requires a source URL.
      </p>

      <form action={createEvidenceAction} className="mt-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ev-brand">Brand</Label>
            <Select id="ev-brand" name="brandId" required>
              <option value="">Select…</option>
              {(brands ?? []).map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ev-product">Product (optional)</Label>
            <Select id="ev-product" name="productId">
              <option value="">Brand-level evidence</option>
              {(products ?? []).map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ev-classification">Supports classification</Label>
            <Select id="ev-classification" name="classification" required>
              {MANUFACTURING_CLASSIFICATIONS.map((value) => (
                <option key={value} value={value}>
                  {CLASSIFICATION_LABELS[value]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ev-type">Evidence type</Label>
            <Select id="ev-type" name="evidenceType" required>
              {EVIDENCE_TYPES.map((value) => (
                <option key={value} value={value}>
                  {value.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ev-source-url">Source URL</Label>
          <Input
            id="ev-source-url"
            name="sourceUrl"
            type="url"
            placeholder="https://"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ev-source-title">Source title</Label>
          <Input id="ev-source-title" name="sourceTitle" maxLength={300} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ev-note">Evidence note</Label>
          <Textarea id="ev-note" name="evidenceNote" maxLength={5000} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ev-confidence">Confidence (0–100)</Label>
            <Input
              id="ev-confidence"
              name="confidenceScore"
              type="number"
              min={0}
              max={100}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ev-internal">Internal notes (never public)</Label>
          <Textarea id="ev-internal" name="internalNotes" maxLength={5000} />
        </div>
        <Button type="submit">Save as pending</Button>
      </form>
    </div>
  );
}
