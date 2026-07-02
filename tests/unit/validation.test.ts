import { describe, expect, it } from "vitest";
import {
  brandClaimSchema,
  brandSubmissionSchema,
  correctionSchema,
  newsletterSignupSchema,
} from "@/lib/validation";

describe("newsletterSignupSchema", () => {
  it("normalizes email casing and whitespace", () => {
    const parsed = newsletterSignupSchema.parse({
      email: "  Person@Example.COM ",
    });
    expect(parsed.email).toBe("person@example.com");
  });

  it("rejects invalid emails", () => {
    expect(newsletterSignupSchema.safeParse({ email: "nope" }).success).toBe(
      false,
    );
    expect(newsletterSignupSchema.safeParse({ email: "" }).success).toBe(false);
  });
});

describe("brandSubmissionSchema", () => {
  const valid = {
    brandName: "Fictional Forge",
    websiteUrl: "https://example.com",
    submitterName: "Sam Submitter",
    submitterEmail: "sam@example.com",
  };

  it("accepts a minimal valid submission", () => {
    expect(brandSubmissionSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects non-http(s) evidence URLs", () => {
    expect(
      brandSubmissionSchema.safeParse({
        ...valid,
        evidenceUrl: "javascript:alert(1)",
      }).success,
    ).toBe(false);
    expect(
      brandSubmissionSchema.safeParse({
        ...valid,
        websiteUrl: "ftp://example.com",
      }).success,
    ).toBe(false);
  });

  it("rejects oversized input", () => {
    expect(
      brandSubmissionSchema.safeParse({
        ...valid,
        description: "x".repeat(5001),
      }).success,
    ).toBe(false);
  });
});

describe("correctionSchema", () => {
  it("requires page URL, issue, and email", () => {
    expect(
      correctionSchema.safeParse({
        pageUrl: "https://madehere.example/brands/x",
        issueDescription: "The state is wrong.",
        submitterEmail: "reader@example.com",
      }).success,
    ).toBe(true);
    expect(
      correctionSchema.safeParse({
        pageUrl: "not-a-url",
        issueDescription: "x",
        submitterEmail: "reader@example.com",
      }).success,
    ).toBe(false);
  });
});

describe("brandClaimSchema", () => {
  it("requires a UUID brand id", () => {
    expect(
      brandClaimSchema.safeParse({
        brandId: "not-a-uuid",
        applicantName: "A",
        companyEmail: "a@example.com",
      }).success,
    ).toBe(false);
    expect(
      brandClaimSchema.safeParse({
        brandId: "7b0d5b0a-2f6d-4f3a-9a44-3f9b1de10a10",
        applicantName: "A. Person",
        companyEmail: "a@brand.example",
      }).success,
    ).toBe(true);
  });
});
