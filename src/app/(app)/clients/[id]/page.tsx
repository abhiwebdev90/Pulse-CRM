import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Mail, MessageSquare, Phone, StickyNote, Users } from "lucide-react";
import { ActivityForm } from "@/components/activity-form";
import { ClientFormButton } from "@/components/client-form";
import { DeleteClientButton } from "@/components/delete-client-button";
import { StageSelect } from "@/components/stage-select";
import { getContext } from "@/lib/workspace";
import { ACTIVITY_TYPES, money, type ActivityType, type Client } from "@/lib/types";

const icons: Record<ActivityType, typeof Phone> = {
  Call: Phone,
  Email: Mail,
  Meeting: Users,
  Note: StickyNote,
};

const date = (d: string) => new Date(d).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" });

function daysAgo(d: string) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000);
  return days <= 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`;
}

export default async function ClientDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { supabase, role } = await getContext();
  const { data: client } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
  if (!client) notFound();
  const c = client as Client;

  const { data: rows } = await supabase
    .from("activities")
    .select("id, type, note, created_at, created_by")
    .eq("client_id", id)
    .order("created_at", { ascending: false });
  const activities = rows ?? [];

  // Names are looked up separately: activities.created_by points at auth.users, not profiles.
  const ids = [...new Set([...activities.map((a) => a.created_by), c.owner_id].filter(Boolean))] as string[];
  const { data: people } = ids.length
    ? await supabase.from("profiles").select("id, full_name").in("id", ids)
    : { data: [] };
  const name = (uid: string | null) => (people ?? []).find((p) => p.id === uid)?.full_name ?? "Someone";

  const counts = ACTIVITY_TYPES.map((t) => ({ type: t, n: activities.filter((a) => a.type === t).length }));

  const facts = [
    { label: "Deal value", value: money(c.value) },
    { label: "Last contact", value: daysAgo(c.last_contact), sub: date(c.last_contact) },
    { label: "Added", value: date(c.created_at), sub: `by ${name(c.owner_id)}` },
    { label: "Activities", value: String(activities.length) },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href="/clients" className="text-sm text-slate-500 hover:underline">
        ← Clients
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{c.name}</h1>
          {c.company && <p className="text-sm text-slate-500">{c.company}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StageSelect id={c.id} status={c.status} />
          <ClientFormButton client={c} />
          {role !== "member" && <DeleteClientButton id={c.id} name={c.name} />}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {facts.map((f) => (
          <div key={f.label} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="text-xs text-slate-500">{f.label}</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{f.value}</div>
            {f.sub && <div className="text-xs text-slate-500">{f.sub}</div>}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <aside className="space-y-4 lg:col-span-1">
          <section className="space-y-2 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <h2 className="text-sm font-semibold">Contact</h2>
            {c.email ? (
              <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-sm text-brand-600 hover:underline">
                <Mail size={14} /> <span className="truncate">{c.email}</span>
              </a>
            ) : (
              <p className="flex items-center gap-2 text-sm text-slate-400"><Mail size={14} /> No email</p>
            )}
            {c.phone ? (
              <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-sm text-brand-600 hover:underline">
                <Phone size={14} /> {c.phone}
              </a>
            ) : (
              <p className="flex items-center gap-2 text-sm text-slate-400"><Phone size={14} /> No phone</p>
            )}
          </section>

          <section className="space-y-2 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <h2 className="text-sm font-semibold">Activity breakdown</h2>
            {counts.map(({ type, n }) => {
              const Icon = icons[type];
              return (
                <div key={type} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400"><Icon size={14} /> {type}</span>
                  <span className="tabular-nums">{n}</span>
                </div>
              );
            })}
          </section>
        </aside>

        <section className="space-y-4 lg:col-span-2">
          <h2 className="font-semibold">Activity</h2>
          <ActivityForm clientId={c.id} />
          {activities.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
              <MessageSquare className="mx-auto mb-2" size={20} /> No activity yet. Log your first call, email or note above.
            </p>
          ) : (
            <ol className="space-y-4 border-l border-slate-200 pl-5 dark:border-slate-800">
              {activities.map((a) => {
                const Icon = icons[a.type as ActivityType] ?? Calendar;
                return (
                  <li key={a.id} className="relative">
                    <span className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-950">
                      <Icon size={11} />
                    </span>
                    <div className="text-xs text-slate-500">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{a.type}</span> · {name(a.created_by)} ·{" "}
                      {new Date(a.created_at).toLocaleString()}
                    </div>
                    <p className="text-sm">{a.note}</p>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
