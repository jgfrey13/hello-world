import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  makeUnsubscribeToken,
  unsubscribeUrl,
  verifyUnsubscribeToken,
} from "@/lib/email/unsubscribe";

describe("unsubscribe tokens", () => {
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const originalSecret = process.env.UNSUBSCRIBE_SECRET;

  beforeEach(() => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-hmac-secret";
    delete process.env.UNSUBSCRIBE_SECRET;
  });
  afterEach(() => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
    if (originalSecret) process.env.UNSUBSCRIBE_SECRET = originalSecret;
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
    // Flip a signature hex digit.
    const tampered = token.slice(0, -1) + (token.endsWith("0") ? "1" : "0");
    expect(verifyUnsubscribeToken("a@example.com", tampered)).toBe(false);
    // Signature without a timestamp segment (the pre-expiry format).
    expect(verifyUnsubscribeToken("a@example.com", token.split(".")[1])).toBe(
      false,
    );
  });

  it("rejects tokens minted with a different secret", () => {
    const token = makeUnsubscribeToken("a@example.com");
    process.env.SUPABASE_SERVICE_ROLE_KEY = "rotated-secret";
    expect(verifyUnsubscribeToken("a@example.com", token)).toBe(false);
  });

  it("prefers the dedicated UNSUBSCRIBE_SECRET when set", () => {
    process.env.UNSUBSCRIBE_SECRET = "dedicated-unsubscribe-secret";
    const token = makeUnsubscribeToken("a@example.com");
    expect(verifyUnsubscribeToken("a@example.com", token)).toBe(true);
    delete process.env.UNSUBSCRIBE_SECRET;
    expect(verifyUnsubscribeToken("a@example.com", token)).toBe(false);
  });

  it("expires tokens after 30 days and rejects future-dated ones", () => {
    const now = Math.floor(Date.now() / 1000);
    const fresh = makeUnsubscribeToken("a@example.com", now - 60);
    expect(verifyUnsubscribeToken("a@example.com", fresh)).toBe(true);

    const expired = makeUnsubscribeToken(
      "a@example.com",
      now - 31 * 24 * 60 * 60,
    );
    expect(verifyUnsubscribeToken("a@example.com", expired)).toBe(false);

    const futureDated = makeUnsubscribeToken("a@example.com", now + 3600);
    expect(verifyUnsubscribeToken("a@example.com", futureDated)).toBe(false);

    // A tampered timestamp invalidates the signature even if in range.
    const [ts, sig] = fresh.split(".");
    const shifted = `${Number(ts) - 10}.${sig}`;
    expect(verifyUnsubscribeToken("a@example.com", shifted)).toBe(false);
  });

  it("builds a normalized unsubscribe URL", () => {
    const url = new URL(unsubscribeUrl("Person@Example.com"));
    expect(url.pathname).toBe("/newsletter/unsubscribe");
    expect(url.searchParams.get("email")).toBe("person@example.com");
    expect(url.searchParams.get("token")).toMatch(/^\d+\.[0-9a-f]{64}$/);
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
