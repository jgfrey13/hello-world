import { describe, expect, it } from "vitest";
import {
  buildSearchHref,
  parseBrandSearchParams,
  parseProductSearchParams,
} from "@/lib/search/params";

describe("parseBrandSearchParams", () => {
  it("applies safe defaults for empty input", () => {
    const params = parseBrandSearchParams({});
    expect(params.page).toBe(1);
    expect(params.sort).toBe("relevance");
    expect(params.q).toBeUndefined();
  });

  it("coerces and clamps hostile input instead of crashing", () => {
    const params = parseBrandSearchParams({
      page: "-5",
      sort: "; drop table brands;",
      classification: "totally_fake",
      price: "999",
    });
    expect(params.page).toBe(1);
    expect(params.sort).toBe("relevance");
    expect(params.classification).toBeUndefined();
    expect(params.price).toBeUndefined();
  });

  it("accepts valid filters", () => {
    const params = parseBrandSearchParams({
      q: "cast iron",
      classification: "verified_made_in_usa",
      state: "Ohio",
      price: "2",
      page: "3",
      sort: "name",
    });
    expect(params).toMatchObject({
      q: "cast iron",
      classification: "verified_made_in_usa",
      state: "Ohio",
      price: 2,
      page: 3,
      sort: "name",
    });
  });

  it("handles array-valued (duplicated) params without crashing", () => {
    const params = parseBrandSearchParams({
      q: ["a", "b"],
      page: ["2", "3"],
    });
    expect(params.q).toBeUndefined();
    expect(params.page).toBe(1);
  });
});

describe("parseProductSearchParams", () => {
  it("supports product-only sorts and brand filter", () => {
    const params = parseProductSearchParams({
      sort: "price_asc",
      brand: "hearthstead-cookware",
    });
    expect(params.sort).toBe("price_asc");
    expect(params.brand).toBe("hearthstead-cookware");
  });
});

describe("buildSearchHref", () => {
  it("omits defaults and empties", () => {
    expect(
      buildSearchHref("/brands", {
        q: undefined,
        page: 1,
        sort: "relevance",
        state: "",
      }),
    ).toBe("/brands");
  });

  it("preserves active filters and page", () => {
    const href = buildSearchHref("/products", {
      q: "skillet",
      category: "cookware",
      page: 2,
    });
    const url = new URL(href, "https://x.example");
    expect(url.pathname).toBe("/products");
    expect(url.searchParams.get("q")).toBe("skillet");
    expect(url.searchParams.get("category")).toBe("cookware");
    expect(url.searchParams.get("page")).toBe("2");
  });

  it("encodes reserved characters safely", () => {
    const href = buildSearchHref("/brands", { q: "a&b=c" });
    expect(href).toBe("/brands?q=a%26b%3Dc");
  });
});
