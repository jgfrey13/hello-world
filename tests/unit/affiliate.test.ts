import { describe, expect, it } from "vitest";
import {
  isApprovedDestination,
  resolveRedirect,
  type RedirectableProduct,
} from "@/lib/affiliate/redirect";

function product(
  overrides: Partial<RedirectableProduct> = {},
): RedirectableProduct {
  return {
    id: "p1",
    brand_id: "b1",
    status: "published",
    affiliate_url: "https://network.example/track/abc",
    direct_purchase_url: "https://brand.example/product",
    ...overrides,
  };
}

describe("isApprovedDestination", () => {
  it("accepts well-formed public https URLs", () => {
    expect(isApprovedDestination("https://brand.example/p/1")).toBe(true);
  });

  it("rejects unsafe destinations", () => {
    for (const bad of [
      null,
      "",
      "http://brand.example/p", // not https
      "javascript:alert(1)",
      "ftp://brand.example/file",
      "https://user:pass@brand.example/", // embedded credentials
      "https://localhost/admin",
      "https://127.0.0.1/",
      "https://10.0.0.5/internal",
      "https://192.168.1.1/",
      "https://internal.service.local/",
      "https://[::1]/",
      "not a url",
    ]) {
      expect(isApprovedDestination(bad)).toBe(false);
    }
  });
});

describe("resolveRedirect", () => {
  it("redirects a published product to its affiliate URL", () => {
    expect(resolveRedirect(product())).toEqual({
      kind: "redirect",
      url: "https://network.example/track/abc",
      destinationType: "affiliate",
    });
  });

  it("falls back to the direct purchase URL", () => {
    expect(resolveRedirect(product({ affiliate_url: null }))).toEqual({
      kind: "redirect",
      url: "https://brand.example/product",
      destinationType: "direct",
    });
  });

  it("falls back to direct when the affiliate URL is unsafe", () => {
    const decision = resolveRedirect(
      product({ affiliate_url: "http://insecure.example/aff" }),
    );
    expect(decision).toEqual({
      kind: "redirect",
      url: "https://brand.example/product",
      destinationType: "direct",
    });
  });

  it("does not redirect missing products", () => {
    expect(resolveRedirect(null)).toEqual({ kind: "not_found" });
  });

  it("does not redirect unpublished products", () => {
    for (const status of ["draft", "pending_review", "rejected", "archived"]) {
      expect(resolveRedirect(product({ status }))).toEqual({ kind: "gone" });
    }
  });

  it("reports no destination when both URLs are missing or unsafe", () => {
    expect(
      resolveRedirect(
        product({ affiliate_url: null, direct_purchase_url: null }),
      ),
    ).toEqual({ kind: "no_destination" });
    expect(
      resolveRedirect(
        product({
          affiliate_url: "javascript:alert(1)",
          direct_purchase_url: "https://user:pw@x.example/",
        }),
      ),
    ).toEqual({ kind: "no_destination" });
  });
});
