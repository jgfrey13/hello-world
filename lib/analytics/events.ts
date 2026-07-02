import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/lib/database/types";

type EventType = Database["public"]["Enums"]["analytics_event_type"];

/**
 * Restrained first-party analytics: one row per event, no visitor PII, no
 * session stitching. Fire-and-forget — analytics failures must never break
 * a page render (errors are logged, not thrown).
 */
export async function recordEvent(event: {
  type: EventType;
  brandId?: string | null;
  productId?: string | null;
  articleId?: string | null;
  path?: string;
}): Promise<void> {
  try {
    const supabase = createSupabaseServiceClient();
    const { error } = await supabase.from("analytics_events").insert({
      event_type: event.type,
      brand_id: event.brandId ?? null,
      product_id: event.productId ?? null,
      article_id: event.articleId ?? null,
      path: event.path ?? null,
    });
    if (error) console.error(`analytics insert failed: ${error.message}`);
  } catch (error) {
    console.error("analytics insert failed:", error);
  }
}
