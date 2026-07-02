import { describe, expect, it } from "vitest";
import { safeLocalRedirect } from "@/lib/security/redirects";
import { serverEnvSchema } from "@/lib/security/env";

describe("safeLocalRedirect", () => {
  it("allows plain local paths", () => {
    expect(safeLocalRedirect("/brands")).toBe("/brands");
    expect(safeLocalRedirect("/admin?tab=claims")).toBe("/admin?tab=claims");
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeLocalRedirect("https://evil.example")).toBe("/");
    expect(safeLocalRedirect("//evil.example")).toBe("/");
    expect(safeLocalRedirect("javascript:alert(1)")).toBe("/");
    expect(safeLocalRedirect("/\\evil.example")).toBe("/");
  });

  it("falls back on non-strings", () => {
    expect(safeLocalRedirect(null)).toBe("/");
    expect(safeLocalRedirect(undefined, "/x")).toBe("/x");
  });
});

describe("server env validation", () => {
  const base = {
    NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "service-key",
  };

  it("accepts a complete configuration", () => {
    expect(serverEnvSchema.safeParse(base).success).toBe(true);
  });

  it("fails fast when required secrets are missing", () => {
    const withoutService: Partial<typeof base> = { ...base };
    delete withoutService.SUPABASE_SERVICE_ROLE_KEY;
    expect(serverEnvSchema.safeParse(withoutService).success).toBe(false);
    expect(
      serverEnvSchema.safeParse({ ...base, NEXT_PUBLIC_SUPABASE_URL: "nope" })
        .success,
    ).toBe(false);
  });
});
