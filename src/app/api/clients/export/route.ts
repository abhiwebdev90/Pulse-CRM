import { filteredClients } from "@/lib/client-query";
import { getContext } from "@/lib/workspace";

// Guards against spreadsheet formula injection (=, +, -, @) when the CSV is opened in Excel/Sheets.
const cell = (v: unknown) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const { supabase, workspace } = await getContext();

  const { data, error } = await filteredClients(
    supabase,
    workspace.id,
    { q: sp.get("q") ?? "", status: sp.get("status") ?? "all", sort: sp.get("sort") ?? "newest" },
    "name, company, email, phone, status, value, last_contact, created_at",
  ).limit(5000);
  if (error) return new Response("Export failed", { status: 500 });

  const header = ["Name", "Company", "Email", "Phone", "Status", "Value", "Last contact", "Created"];
  const lines = [header.map(cell).join(",")];
  for (const c of (data ?? []) as unknown as Record<string, unknown>[]) {
    lines.push([c.name, c.company, c.email, c.phone, c.status, c.value, c.last_contact, c.created_at].map(cell).join(","));
  }

  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clients-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
