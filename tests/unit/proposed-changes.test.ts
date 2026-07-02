import { describe, expect, it } from "vitest";
import {
  proposedBrandChangeSchema,
  proposedNewProductSchema,
  proposedProductChangeSchema,
} from "@/lib/validation";

/**
 * The paid-content firewall in schema form: owner-proposed changes may touch
 * descriptive fields only. These schemas are shared by the owner submission
 * forms and the admin apply step — if a hostile payload passes them, it would
 * be applied, so these tests guard the whitelist itself.
 */
describe("proposed brand change whitelist", () => {
  it("accepts descriptive fields", () => {
    expect(
      proposedBrandChangeSchema.safeParse({
        summary: "New summary",
        founded_year: 1990,
      }).success,
    ).toBe(true);
  });

  it("rejects classification, status, verification, and billing keys", () => {
    for (const hostile of [
      { manufacturing_classification: "verified_made_in_usa" },
      { status: "published" },
      { verification_status: "approved" },
      { subscription_tier: "featured" },
      { is_featured: true },
      { is_sponsored: false },
      { summary: "ok", status: "published" },
    ]) {
      expect(proposedBrandChangeSchema.safeParse(hostile).success).toBe(false);
    }
  });

  it("rejects empty proposals", () => {
    expect(proposedBrandChangeSchema.safeParse({}).success).toBe(false);
  });
});

describe("proposed product change whitelist", () => {
  it("rejects classification and evidence keys", () => {
    for (const hostile of [
      { manufacturing_classification: "verified_made_in_usa" },
      { status: "published" },
      { affiliate_url: "https://x.example" },
      { summary: "ok", manufacturing_classification: "assembled_in_usa" },
    ]) {
      expect(proposedProductChangeSchema.safeParse(hostile).success).toBe(
        false,
      );
    }
    expect(
      proposedProductChangeSchema.safeParse({ summary: "ok" }).success,
    ).toBe(true);
  });
});

describe("proposed new product whitelist", () => {
  it("requires a name and rejects classification/status keys", () => {
    expect(proposedNewProductSchema.safeParse({}).success).toBe(false);
    expect(
      proposedNewProductSchema.safeParse({ name: "New Thing" }).success,
    ).toBe(true);
    expect(
      proposedNewProductSchema.safeParse({
        name: "New Thing",
        manufacturing_classification: "verified_made_in_usa",
      }).success,
    ).toBe(false);
    expect(
      proposedNewProductSchema.safeParse({
        name: "New Thing",
        status: "published",
      }).success,
    ).toBe(false);
  });
});
