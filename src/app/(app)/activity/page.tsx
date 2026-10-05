import Link from "next/link";
import { Calendar, Mail, Phone, StickyNote, Users } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { getContext } from "@/lib/workspace";
import { ACTIVITY_TYPES, type ActivityType } from "@/lib/types";

const icons: Record<ActivityType, typeof Phone> = { Call: Phone, Email: Mail, Meeting: Users, Note: StickyNote };
const size = 30;

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ type?: string; page?: string }> }) {
  const { type = "all", page = "1" } = await searchParams;
  const { supabase, workspace } = await getContext();
  const from = (Math.max(1, Number(page) || 1) - 1) * size;

  let query = supabase
    .from("activities")
    .select("id, type, note, created_at, created_by, client_id", { count: "exact" })
    .eq("workspace_id", workspace.id);
  if ((ACTIVITY_TYPES as readonly string[]).includes(type)) query = query.eq("type", type);
  const { data, count } = await query.order("created_at", { ascending: false }).range(from, from + size - 1);
  const rows = data ?? [];

  const clientIds = [...new Set(rows.map((r) => r.client_id))];
  const authorIds = [...new Set(rows.map((r) => r.created_by).filter(Boolean))] as string[];
  const [{ data: clients }, { data: people }] = await Promise.all([
    clientIds.length ? supabase.from("clients").select("id, name").in("id", clientIds) : Promise.resolve({ data: [] }),
    authorIds.length ? supabase.from("profiles").select("id, full_name").in("id", authorIds) : Promise.resolve({ data: [] }),
  ]);
  const clientName = (id: string) => (clients ?? []).find((c) => c.id === id)?.name ?? "Unknown client";
  const author = (id: string | null) => (people ?? []).find((p) => p.id === id)?.full_name ?? "Someone";

  const pages = Math.max(1, Math.ceil((count ?? 0) / size));
  const current = from / size + 1;
  const href = (over: Record<string, string>) => `/activity?${new URLSearchParams({ type, page: "1", ...over })}`;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Activity</h1>
        <p className="text-sm text-slate-500">Everything your team has logged in {workspace.name}.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", ...ACTIVITY_TYPES].map((t) => (
          <Link
            key={t}
            href={href({ type: t })}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              type === t
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-900"
            }`}
          >
            {t === "all" ? "All" : t}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700">
          No activity to show.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {rows.map((a) => {
            const Icon = icons[a.type as ActivityType] ?? Calendar;
            return (
              <li key={a.id} className="flex gap-3 px-4 py-3">
                <Avatar name={author(a.created_by)} size={34} />
                <div className="min-w-0 flex-1 text-sm">
                  <div>
                    <span className="font-medium">{author(a.created_by)}</span>{" "}
                    <span className="inline-flex items-center gap-1 text-slate-500">
                      <Icon size={12} /> {a.type.toLowerCase()} with
                    </span>{" "}
                    <Link href={`/clients/${a.client_id}`} className="text-brand-600 hover:underline">
                      {clientName(a.client_id)}
                    </Link>
                  </div>
                  <p className="mt-0.5 text-slate-600 dark:text-slate-400">{a.note}</p>
                  <div className="mt-0.5 text-xs text-slate-400">{new Date(a.created_at).toLocaleString()}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">
            Page {current} of {pages}
          </span>
          <div className="flex gap-2">
            {current > 1 && (
              <Link href={href({ page: String(current - 1) })} className="rounded-lg border px-3 py-1.5 dark:border-slate-700">
                Previous
              </Link>
            )}
            {current < pages && (
              <Link href={href({ page: String(current + 1) })} className="rounded-lg border px-3 py-1.5 dark:border-slate-700">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
