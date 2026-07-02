import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  makeUnsubscribeToken,
  unsubscribeUrl,
  verifyUnsubscribeToken,
} from "@/lib/email/unsubscribe";

describe("unsubscribe tokens", () => {
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  beforeEach(() => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-hmac-secret";
  });
  afterEach(() => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
  });

  it("verifies a token for the same normalized email", () => {
    const token = makeUnsubscribeToken("Person@Example.com ");
    expect(verifyUnsubscribeToken("person@example.com", token)).toBe(true);
  });

  it("rejects tokens for a different email", () => {
    const token = makeUnsubscribeToken("a@example.com");
    expect(verifyUnsubscribeToken("b@example.com", token)).toBe(false);
  });

  it("rejects malformed and tampered tokens", () => {
    const token = makeUnsubscribeToken("a@example.com");
    expect(verifyUnsubscribeToken("a@example.com", "nope")).toBe(false);
    expect(verifyUnsubscribeToken("a@example.com", "")).toBe(false);
    const tampered = (token[0] === "0" ? "1" : "0") + token.slice(1);
    expect(verifyUnsubscribeToken("a@example.com", tampered)).toBe(false);
  });

  it("rejects tokens minted with a different secret", () => {
    const token = makeUnsubscribeToken("a@example.com");
    process.env.SUPABASE_SERVICE_ROLE_KEY = "rotated-secret";
    expect(verifyUnsubscribeToken("a@example.com", token)).toBe(false);
  });

  it("builds a normalized unsubscribe URL", () => {
    const url = new URL(unsubscribeUrl("Person@Example.com"));
    expect(url.pathname).toBe("/newsletter/unsubscribe");
    expect(url.searchParams.get("email")).toBe("person@example.com");
    expect(url.searchParams.get("token")).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("sendEmail without configuration", () => {
  it("skips honestly instead of throwing", async () => {
    const original = {
      key: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM,
    };
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    const { sendEmail } = await import("@/lib/email");
    const result = await sendEmail({
      to: "x@example.com",
      subject: "test",
      text: "test",
    });
    expect(result).toEqual({ sent: false, reason: "not_configured" });
    if (original.key) process.env.RESEND_API_KEY = original.key;
    if (original.from) process.env.EMAIL_FROM = original.from;
  });
});
