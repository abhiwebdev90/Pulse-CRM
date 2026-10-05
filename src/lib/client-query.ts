import type { SupabaseClient } from "@supabase/supabase-js";
import { STATUSES } from "@/lib/types";

export const SORTS: Record<string, [string, boolean]> = {
  newest: ["created_at", false],
  name_asc: ["name", true],
  name_desc: ["name", false],
  company_asc: ["company", true],
  company_desc: ["company", false],
  status_asc: ["status", true],
  status_desc: ["status", false],
  value_desc: ["value", false],
  value_asc: ["value", true],
  recent: ["last_contact", false],
};

export type ClientFilters = { q?: string; status?: string; sort?: string };

// Shared by the clients page and the CSV export so they always agree on what is filtered.
export function filteredClients(
  supabase: SupabaseClient,
  workspaceId: string,
  { q = "", status = "all", sort = "newest" }: ClientFilters,
  columns = "*",
  options?: { count: "exact" },
) {
  let query = supabase.from("clients").select(columns, options).eq("workspace_id", workspaceId);
  if ((STATUSES as readonly string[]).includes(status)) query = query.eq("status", status);
  // Strip characters that carry meaning in PostgREST filter syntax and ilike wildcards.
  const term = q.replace(/[%_,()*\\]/g, " ").trim();
  if (term) query = query.or(`name.ilike.%${term}%,company.ilike.%${term}%,email.ilike.%${term}%`);
  const [col, asc] = SORTS[sort] ?? SORTS.newest;
  return query.order(col, { ascending: asc, nullsFirst: false });
}
