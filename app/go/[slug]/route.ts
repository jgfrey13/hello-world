import { NextResponse, type NextRequest } from "next/server";
import { after } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { resolveRedirect } from "@/lib/affiliate/redirect";

export const dynamic = "force-dynamic";

function plainResponse(status: number, message: string): NextResponse {
  return new NextResponse(message, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

/**
 * Tracked outbound redirect: /go/[slug]
 * 1. Look up the product (service client — includes delisted rows so we can
 *    distinguish "gone" from "never existed").
 * 2. Validate the stored destination (https, public host, no credentials).
 * 3. Record a privacy-conscious click after the response is sent.
 * 4. 302 to the affiliate URL, falling back to the direct purchase URL.
 * Redirect responses are never cached and never indexed.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,200}$/.test(slug)) {
    return plainResponse(404, "Not found");
  }

  const supabase = createSupabaseServiceClient();
  const { data: product, error } = await supabase
    .from("products")
    .select("id, brand_id, status, affiliate_url, direct_purchase_url")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    return plainResponse(503, "Temporarily unavailable");
  }

  const decision = resolveRedirect(product);

  switch (decision.kind) {
    case "not_found":
      return plainResponse(404, "Not found");
    case "gone":
      return plainResponse(410, "This product is no longer listed.");
    case "no_destination":
      return NextResponse.redirect(
        new URL(`/products/${slug}`, request.nextUrl.origin),
        302,
      );
    case "redirect": {
      // Privacy-conscious click record: no IP, no user agent, no user id.
      const referrer = request.headers.get("referer");
      let referrerPath: string | null = null;
      try {
        referrerPath = referrer ? new URL(referrer).pathname : null;
      } catch {
        referrerPath = null;
      }
      const sessionId = request.cookies.get("mh_sid")?.value ?? null;

      after(async () => {
        const { error: clickError } = await supabase
          .from("affiliate_clicks")
          .insert({
            product_id: product!.id,
            brand_id: product!.brand_id,
            destination_type: decision.destinationType,
            destination_url: decision.url,
            referrer_path: referrerPath,
            anonymous_session_id: sessionId,
          });
        if (clickError) {
          console.error(`affiliate click insert failed: ${clickError.message}`);
        }
      });

      const response = NextResponse.redirect(decision.url, 302);
      response.headers.set("cache-control", "no-store");
      response.headers.set("x-robots-tag", "noindex");
      return response;
    }
  }
}
