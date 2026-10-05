import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Clock } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { DashboardCharts } from "@/components/dashboard-charts";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { StatusPill } from "@/components/status-pill";
import { DAY_MS, daysSince, nowMs } from "@/lib/time";
import { getContext } from "@/lib/workspace";
import { STATUSES, money, type Status } from "@/lib/types";

const RANGES = [7, 30, 90] as const;
const DAY = DAY_MS;
const card = "rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/40";

function Trend({ now, before }: { now: number; before: number }) {
  if (before === 0 && now === 0) return <span className="text-xs text-slate-400">no change</span>;
  if (before === 0) return <span className="text-xs text-emerald-600">new this period</span>;
  const pct = Math.round(((now - before) / before) * 100);
  const up = pct >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center text-xs font-medium ${up ? "text-emerald-600" : "text-rose-600"}`}>
      <Icon size={13} /> {Math.abs(pct)}% vs previous
    </span>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range: rangeParam } = await searchParams;
  const range = RANGES.find((r) => String(r) === rangeParam) ?? 30;

  const { supabase, workspace, displayName } = await getContext();
  const { data } = await supabase
    .from("clients")
    .select("id, name, company, status, value, created_at, updated_at, last_contact")
    .eq("workspace_id", workspace.id);
  const rows = (data ?? []).map((c) => ({ ...c, value: Number(c.value), status: c.status as Status }));

  const now = nowMs();
  const inWindow = (iso: string, from: number, to: number) => {
    const t = new Date(iso).getTime();
    return t >= now - to * DAY && t < now - from * DAY;
  };

  const won = rows.filter((c) => c.status === "Won");
  const closed = rows.filter((c) => c.status === "Won" || c.status === "Lost").length;
  const openDeals = rows.filter((c) => c.status !== "Won" && c.status !== "Lost");

  const newLeads = rows.filter((c) => inWindow(c.created_at, 0, range)).length;
  const prevLeads = rows.filter((c) => inWindow(c.created_at, range, range * 2)).length;
  const wonNow = won.filter((c) => inWindow(c.updated_at, 0, range)).reduce((s, c) => s + c.value, 0);
  const wonPrev = won.filter((c) => inWindow(c.updated_at, range, range * 2)).reduce((s, c) => s + c.value, 0);
  const openValue = openDeals.reduce((s, c) => s + c.value, 0);
  const winRate = closed ? Math.round((won.length / closed) * 100) : 0;

  const stats = [
    { label: `New leads (${range}d)`, value: String(newLeads), trend: <Trend now={newLeads} before={prevLeads} /> },
    { label: `Won revenue (${range}d)`, value: money(wonNow), trend: <Trend now={wonNow} before={wonPrev} /> },
    { label: "Open pipeline", value: money(openValue), trend: <span className="text-xs text-slate-400">{openDeals.length} open deals</span> },
    { label: "Win rate", value: `${winRate}%`, trend: <span className="text-xs text-slate-400">{won.length} won of {closed} closed</span> },
  ];

  const byStatus = STATUSES.map((status) => ({ status, count: rows.filter((c) => c.status === status).length }));
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    return { key: `${d.getFullYear()}-${d.getMonth()}`, month: d.toLocaleString("en", { month: "short" }), total: 0 };
  });
  for (const c of won) {
    const d = new Date(c.updated_at);
    const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (m) m.total += c.value;
  }

  const followUps = openDeals
    .filter((c) => now - new Date(c.last_contact).getTime() > 14 * DAY)
    .sort((a, b) => a.last_contact.localeCompare(b.last_contact))
    .slice(0, 5);
  const topDeals = [...openDeals].sort((a, b) => b.value - a.value).slice(0, 5);

  const { data: acts } = await supabase
    .from("activities")
    .select("id, type, note, created_at, created_by, client_id")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false })
    .limit(8);
  const activities = acts ?? [];
  const authorIds = [...new Set(activities.map((a) => a.created_by).filter(Boolean))] as string[];
  const { data: people } = authorIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", authorIds)
    : { data: [] };
  const clientName = (id: string) => rows.find((c) => c.id === id)?.name ?? "a client";
  const author = (id: string | null) => (people ?? []).find((p) => p.id === id)?.full_name ?? "Someone";

  // Onboarding checklist: derived from data we already have plus two cheap counts.
  const [{ count: memberCount }, { count: inviteCount }] = await Promise.all([
    supabase.from("workspace_members").select("user_id", { count: "exact", head: true }).eq("workspace_id", workspace.id),
    supabase.from("invites").select("id", { count: "exact", head: true }).eq("workspace_id", workspace.id),
  ]);
  const checklist = [
    { label: "Add your first client", hint: "Start tracking a lead or customer", href: "/clients", done: rows.length > 0 },
    { label: "Log an activity", hint: "Record a call, email or meeting", href: "/clients", done: activities.length > 0 },
    { label: "Close a deal", hint: "Move a client to Won in the pipeline", href: "/pipeline", done: won.length > 0 },
    { label: "Invite a teammate", hint: "Work on the pipeline together", href: "/team", done: (memberCount ?? 0) > 1 || (inviteCount ?? 0) > 0 },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {greeting}, {displayName.split(" ")[0]}
          </h1>
          <p className="text-sm text-slate-500">
            {new Date().toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })} · {workspace.name}
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 text-sm dark:border-slate-800">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/dashboard?range=${r}`}
              className={`rounded-md px-3 py-1 ${r === range ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"}`}
            >
              {r}d
            </Link>
          ))}
        </div>
      </div>

      <OnboardingChecklist workspaceId={workspace.id} items={checklist} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={card}>
            <div className="text-xs text-slate-500">{s.label}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</div>
            <div className="mt-1">{s.trend}</div>
          </div>
        ))}
      </div>

      <DashboardCharts byStatus={byStatus} trend={months.map(({ month, total }) => ({ month, total }))} />

      <div className="grid gap-4 lg:grid-cols-3">
        <section className={card}>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Clock size={15} className="text-amber-500" /> Needs follow-up
          </h2>
          {followUps.length === 0 ? (
            <p className="text-sm text-slate-500">Nobody is overdue. Nice work.</p>
          ) : (
            <ul className="space-y-2">
              {followUps.map((c) => (
                <li key={c.id}>
                  <Link href={`/clients/${c.id}`} className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <Avatar name={c.name} size={30} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{c.name}</span>
                      <span className="block text-xs text-amber-600">
                        {daysSince(c.last_contact)} days since contact
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={card}>
          <h2 className="mb-3 text-sm font-medium">Top open deals</h2>
          {topDeals.length === 0 ? (
            <p className="text-sm text-slate-500">No open deals.</p>
          ) : (
            <ul className="space-y-2">
              {topDeals.map((c) => (
                <li key={c.id}>
                  <Link href={`/clients/${c.id}`} className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{c.name}</span>
                      <StatusPill status={c.status} />
                    </span>
                    <span className="text-sm font-semibold tabular-nums">{money(c.value)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={card}>
          <h2 className="mb-3 flex items-center justify-between text-sm font-medium">
            Recent activity
            <Link href="/activity" className="text-xs font-normal text-brand-600 hover:underline">View all</Link>
          </h2>
          {activities.length === 0 ? (
            <p className="text-sm text-slate-500">No activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {activities.slice(0, 5).map((a) => (
                <li key={a.id} className="flex gap-2.5">
                  <Avatar name={author(a.created_by)} size={26} />
                  <div className="min-w-0 text-sm">
                    <div className="truncate">
                      <span className="font-medium">{author(a.created_by)}</span> logged a {a.type.toLowerCase()} with{" "}
                      <Link href={`/clients/${a.client_id}`} className="text-brand-600 hover:underline">{clientName(a.client_id)}</Link>
                    </div>
                    <div className="truncate text-xs text-slate-500">{a.note}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
