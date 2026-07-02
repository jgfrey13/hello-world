import { requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/states";

export const metadata = { title: "Audit Log" };

export default async function AdminAuditPage() {
  await requireRole("admin");
  const supabase = await createSupabaseServerClient();
  const { data: entries, error } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`audit log failed: ${error.message}`);

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold">Audit log</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Append-only record of sensitive administrative actions (most recent
        100).
      </p>

      {(entries ?? []).length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No audit entries yet" />
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary text-left">
                <th scope="col" className="px-4 py-2.5 font-medium">
                  When
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Action
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Entity
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Change
                </th>
              </tr>
            </thead>
            <tbody>
              {(entries ?? []).map((entry) => (
                <tr key={entry.id} className="border-t align-top">
                  <td className="text-muted-foreground px-4 py-2.5 whitespace-nowrap">
                    {new Date(entry.created_at).toLocaleString("en-US")}
                  </td>
                  <td className="px-4 py-2.5 font-medium">{entry.action}</td>
                  <td className="text-muted-foreground px-4 py-2.5">
                    {entry.entity}
                  </td>
                  <td className="text-muted-foreground px-4 py-2.5">
                    {(entry.before_state || entry.after_state) && (
                      <code className="text-xs">
                        {entry.before_state &&
                          JSON.stringify(entry.before_state)}
                        {entry.before_state && entry.after_state && " → "}
                        {entry.after_state && JSON.stringify(entry.after_state)}
                      </code>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
