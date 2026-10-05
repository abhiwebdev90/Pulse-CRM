import Link from "next/link";
import { Download, Search, Users } from "lucide-react";
import { ClientFormButton } from "@/components/client-form";
import { ClientsTable, type SortColumn } from "@/components/clients-table";
import { filteredClients } from "@/lib/client-query";
import { getContext } from "@/lib/workspace";
import { STATUSES, type Client } from "@/lib/types";

const box = "rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string; page?: string }>;
}) {
  const { q = "", status = "all", sort = "newest", page = "1" } = await searchParams;
  const { supabase, workspace, role } = await getContext();
  const size = 20;
  const from = (Math.max(1, Number(page) || 1) - 1) * size;

  const { data, count } = await filteredClients(supabase, workspace.id, { q, status, sort }, "*", { count: "exact" }).range(from, from + size - 1);
  const clients = (data ?? []) as unknown as Client[];
  const pages = Math.max(1, Math.ceil((count ?? 0) / size));
  const current = from / size + 1;

  const url = (over: Record<string, string>) => `/clients?${new URLSearchParams({ q, status, sort, page: "1", ...over })}`;

  // Clicking a header toggles asc/desc for that column.
  const col = (key: string, label: string, right = false): SortColumn => {
    const asc = `${key}_asc`;
    const desc = `${key}_desc`;
    return { key, label, right, dir: sort === asc ? "asc" : sort === desc ? "desc" : null, href: url({ sort: sort === asc ? desc : asc }) };
  };
  const columns = [col("name", "Name"), col("company", "Company"), col("status", "Status"), col("value", "Value", true)];

  const exportHref = `/api/clients/export?${new URLSearchParams({ q, status, sort })}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-sm text-slate-500">{count ?? 0} total</p>
        </div>
        <div className="flex gap-2">
          <a href={exportHref} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900">
            <Download size={15} /> Export CSV
          </a>
          <ClientFormButton />
        </div>
      </div>

      <form className="flex flex-wrap gap-2">
        <input type="hidden" name="status" value={status} />
        <div className="relative min-w-48 flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input name="q" defaultValue={q} placeholder="Search name, company, email" className={`w-full pl-9 ${box}`} />
        </div>
        <select name="sort" defaultValue={sort} className={box}>
          <option value="newest">Newest</option>
          <option value="recent">Recent contact</option>
          <option value="value_desc">Value ↓</option>
          <option value="value_asc">Value ↑</option>
        </select>
        <button className={box}>Apply</button>
      </form>

      <div className="flex flex-wrap gap-2">
        {["all", ...STATUSES].map((s) => (
          <Link
            key={s}
            href={url({ status: s })}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              status === s
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-900"
            }`}
          >
            {s === "all" ? "All" : s}
          </Link>
        ))}
      </div>

      {clients.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
          <span className="rounded-full bg-brand-50 p-3 text-brand-600 dark:bg-brand-950">
            <Users size={22} />
          </span>
          <p className="text-sm text-slate-500">{q || status !== "all" ? "No clients match these filters." : "No clients yet. Add your first one."}</p>
          {(q || status !== "all") && (
            <Link href="/clients" className="text-sm text-brand-600 hover:underline">
              Clear filters
            </Link>
          )}
        </div>
      ) : (
        <ClientsTable clients={clients} columns={columns} canDelete={role !== "member"} />
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">
            Page {current} of {pages}
          </span>
          <div className="flex gap-2">
            {current > 1 && (
              <Link href={url({ page: String(current - 1) })} className="rounded-lg border px-3 py-1.5 dark:border-slate-700">
                Previous
              </Link>
            )}
            {current < pages && (
              <Link href={url({ page: String(current + 1) })} className="rounded-lg border px-3 py-1.5 dark:border-slate-700">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
