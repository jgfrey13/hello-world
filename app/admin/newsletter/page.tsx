import { requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/states";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Newsletter" };

export default async function AdminNewsletterPage() {
  await requireRole("admin");
  const supabase = await createSupabaseServerClient();
  const [{ count: active }, { data: recent, error }] = await Promise.all([
    supabase
      .from("newsletter_subscribers")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("newsletter_subscribers")
      .select("id, email, first_name, status, consent_source, consent_at")
      .order("consent_at", { ascending: false })
      .limit(25),
  ]);
  if (error) throw new Error(`newsletter admin failed: ${error.message}`);

  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-2xl font-bold">Newsletter</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        {active ?? 0} active subscriber{(active ?? 0) === 1 ? "" : "s"}. Signup
        capture activates with the notifications phase; campaigns require
        sender-domain authentication and working unsubscribe first.
      </p>

      {(recent ?? []).length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No subscribers yet" />
        </div>
      ) : (
        <ul className="mt-6 divide-y rounded-lg border">
          {(recent ?? []).map((subscriber) => (
            <li
              key={subscriber.id}
              className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
            >
              <span>
                {subscriber.email}
                {subscriber.first_name && (
                  <span className="text-muted-foreground">
                    {" "}
                    ({subscriber.first_name})
                  </span>
                )}
              </span>
              <span className="text-muted-foreground flex items-center gap-2 text-xs">
                {subscriber.consent_source}
                <Badge
                  variant={subscriber.status === "active" ? "default" : "muted"}
                >
                  {subscriber.status}
                </Badge>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
