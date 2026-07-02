import { describe, expect, it } from "vitest";
import { parseCsv, parseCsvRecords } from "@/lib/ingestion/csv";
import { normalizeDomain } from "@/lib/ingestion/domains";
import { slugifyName, validateBrandRows } from "@/lib/ingestion/brands-import";

describe("parseCsv", () => {
  it("parses plain rows", () => {
    expect(parseCsv("a,b,c\nd,e,f")).toEqual([
      ["a", "b", "c"],
      ["d", "e", "f"],
    ]);
  });

  it("handles quoted fields with commas, newlines, and escaped quotes", () => {
    const input = `name,note\n"Smith, Co","line1\nline2"\n"He said ""hi""",x`;
    expect(parseCsv(input)).toEqual([
      ["name", "note"],
      ["Smith, Co", "line1\nline2"],
      ['He said "hi"', "x"],
    ]);
  });

  it("handles CRLF and trailing newline", () => {
    expect(parseCsv("a,b\r\nc,d\r\n")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("keyed records lowercase headers and skip blank lines", () => {
    const { header, records } = parseCsvRecords(
      "Name,Website_URL\n\nAcme,https://acme.example\n",
    );
    expect(header).toEqual(["name", "website_url"]);
    expect(records).toEqual([
      { name: "Acme", website_url: "https://acme.example" },
    ]);
  });
});

describe("normalizeDomain", () => {
  it("normalizes scheme, www, and case; tolerates bare domains", () => {
    expect(normalizeDomain("https://www.Acme.Example/products?x=1")).toBe(
      "acme.example",
    );
    expect(normalizeDomain("http://acme.example")).toBe("acme.example");
    expect(normalizeDomain("acme.example/path")).toBe("acme.example");
  });

  it("returns null for garbage", () => {
    expect(normalizeDomain("")).toBeNull();
    expect(normalizeDomain(null)).toBeNull();
    expect(normalizeDomain("ht!tp://???")).toBeNull();
  });
});

describe("validateBrandRows", () => {
  const noExisting = { domains: new Set<string>(), slugs: new Set<string>() };

  it("accepts a valid row and derives the slug", () => {
    const [row] = validateBrandRows(
      [{ name: "Acme Forge Co.", website_url: "https://acme.example" }],
      noExisting,
    );
    expect(row.ok).toBe(true);
    expect(row.data?.slug).toBe("acme-forge-co");
  });

  it("flags invalid fields per row without failing the batch", () => {
    const rows = validateBrandRows(
      [
        { name: "", website_url: "https://ok.example" },
        { name: "Fine", website_url: "not-a-url" },
        { name: "Good", website_url: "https://good.example" },
      ],
      noExisting,
    );
    expect(rows.map((row) => row.ok)).toEqual([false, false, true]);
    expect(rows[0].issues[0]).toMatch(/name/);
    expect(rows[1].issues[0]).toMatch(/website_url/);
  });

  it("flags duplicates against existing brands (domain and slug)", () => {
    const rows = validateBrandRows(
      [
        { name: "New Brand", website_url: "https://www.taken.example" },
        { name: "Existing Brand", website_url: "https://fresh.example" },
      ],
      {
        domains: new Set(["taken.example"]),
        slugs: new Set(["existing-brand"]),
      },
    );
    expect(rows[0].ok).toBe(false);
    expect(rows[0].issues[0]).toMatch(/domain taken.example already exists/);
    expect(rows[1].ok).toBe(false);
    expect(rows[1].issues[0]).toMatch(/slug existing-brand already in use/);
  });

  it("flags duplicates within the same file", () => {
    const rows = validateBrandRows(
      [
        { name: "First", website_url: "https://same.example" },
        { name: "Second", website_url: "https://www.same.example/other" },
      ],
      noExisting,
    );
    expect(rows[0].ok).toBe(true);
    expect(rows[1].ok).toBe(false);
    expect(rows[1].issues[0]).toMatch(/appears earlier in this file/);
  });

  it("slugifyName strips punctuation and clamps length", () => {
    expect(slugifyName("  Héllo -- World! ")).toBe("h-llo-world");
    expect(slugifyName("x".repeat(200)).length).toBeLessThanOrEqual(80);
  });
});
