import "server-only";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Json } from "@/lib/database/types";

/**
 * Append an audit-log entry for a sensitive administrative action.
 * Service-role write (the table is append-only with admin-only reads).
 * Never include secrets or payment details in before/after state.
 */
export async function recordAudit(entry: {
  actor: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  before?: Json | null;
  after?: Json | null;
}): Promise<void> {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from("audit_log").insert({
    actor: entry.actor,
    action: entry.action,
    entity: entry.entity,
    entity_id: entry.entityId ?? null,
    before_state: entry.before ?? null,
    after_state: entry.after ?? null,
  });
  if (error) {
    // Audit failures must be visible in logs but shouldn't mask the action's
    // own error handling.
    console.error(`audit_log insert failed: ${error.message}`);
  }
}
