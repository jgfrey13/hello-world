import { requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FormStatusBanner } from "@/components/forms/form-status-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/states";
import {
  createSponsorshipAction,
  setSponsorshipStatusAction,
} from "@/app/admin/sponsorships/actions";

export const metadata = { title: "Sponsorships" };

export default async function AdminSponsorshipsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("admin");
  const { status } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const [{ data: sponsorships, error }, { data: brands }] = await Promise.all([
    supabase
      .from("sponsorships")
      .select("*, brands!inner(name)")
      .order("start_date", { ascending: false })
      .limit(50),
    supabase.from("brands").select("id, name").order("name"),
  ]);
  if (error) throw new Error(`sponsorships failed: ${error.message}`);

  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-2xl font-bold">Sponsorships</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Every placement is conspicuously labeled wherever it appears, and never
        affects classifications, evidence review, or editorial conclusions.
      </p>
      <div className="mt-4">
        <FormStatusBanner status={status} />
      </div>

      {(sponsorships ?? []).length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No sponsorships recorded" />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {(sponsorships ?? []).map((sponsorship) => (
            <li
              key={sponsorship.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 text-sm"
            >
              <div>
                <p className="font-medium">
                  {sponsorship.brands.name} — {sponsorship.placement_type}
                </p>
                <p className="text-muted-foreground">
                  {sponsorship.start_date}
                  {sponsorship.end_date && <> → {sponsorship.end_date}</>}
                  {sponsorship.placement_location && (
                    <> · {sponsorship.placement_location}</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    sponsorship.status === "active" ? "default" : "muted"
                  }
                >
                  {sponsorship.status}
                </Badge>
                {sponsorship.status === "scheduled" && (
                  <form action={setSponsorshipStatusAction}>
                    <input type="hidden" name="id" value={sponsorship.id} />
                    <input type="hidden" name="status" value="active" />
                    <Button type="submit" size="sm" variant="outline">
                      Activate
                    </Button>
                  </form>
                )}
                {sponsorship.status === "active" && (
                  <form action={setSponsorshipStatusAction}>
                    <input type="hidden" name="id" value={sponsorship.id} />
                    <input type="hidden" name="status" value="completed" />
                    <Button type="submit" size="sm" variant="outline">
                      Complete
                    </Button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-8 font-serif text-lg font-semibold">New sponsorship</h2>
      <form action={createSponsorshipAction} className="mt-3 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="s-brand">Brand</Label>
            <Select id="s-brand" name="brandId" required>
              <option value="">Select…</option>
              {(brands ?? []).map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-type">Placement type</Label>
            <Select id="s-type" name="placementType" required>
              <option value="">Select…</option>
              <option value="homepage">Homepage placement</option>
              <option value="category_featured">
                Featured category placement
              </option>
              <option value="sponsored_guide">Sponsored guide</option>
              <option value="newsletter">Newsletter sponsorship</option>
              <option value="other">Other</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-location">Placement location (optional)</Label>
            <Input id="s-location" name="placementLocation" maxLength={200} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-amount">Amount (USD, optional)</Label>
            <Input
              id="s-amount"
              name="amount"
              type="number"
              step="0.01"
              min={0}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-start">Start date</Label>
            <Input id="s-start" name="startDate" type="date" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-end">End date (optional)</Label>
            <Input id="s-end" name="endDate" type="date" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-disclosure">
            Disclosure text (optional override)
          </Label>
          <Input id="s-disclosure" name="disclosureText" maxLength={500} />
        </div>
        <Button type="submit">Record sponsorship</Button>
      </form>
    </div>
  );
}
