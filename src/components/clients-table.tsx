"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Mail, Phone, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/avatar";
import { StatusPill } from "@/components/status-pill";
import { bulkSetStatus, getRecentActivities, type QuickActivity } from "@/lib/actions/clients";
import { deleteClientsWithUndo, usePendingDeletes } from "@/lib/pending-deletes";
import { STATUSES, money, type Client } from "@/lib/types";

type Row = Pick<Client, "id" | "name" | "company" | "email" | "phone" | "status" | "value" | "last_contact">;

export type SortColumn = { key: string; label: string; href: string; dir: "asc" | "desc" | null; right?: boolean };

function QuickView({ client, onClose }: { client: Row; onClose: () => void }) {
  const [activities, setActivities] = useState<QuickActivity[] | null>(null);

  useEffect(() => {
    let current = true;
    getRecentActivities(client.id).then((a) => current && setActivities(a));
    return () => {
      current = false;
    };
  }, [client.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col gap-5 overflow-y-auto bg-white p-5 shadow-xl dark:bg-slate-950">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={client.name} size={44} />
            <div>
              <div className="font-semibold">{client.name}</div>
              <div className="text-sm text-slate-500">{client.company}</div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <StatusPill status={client.status} />
          <span className="text-lg font-semibold tabular-nums">{money(client.value)}</span>
        </div>

        <div className="space-y-2 text-sm">
          {client.email && (
            <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-brand-600 hover:underline">
              <Mail size={14} /> {client.email}
            </a>
          )}
          {client.phone && (
            <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-brand-600 hover:underline">
              <Phone size={14} /> {client.phone}
            </a>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Recent activity</h3>
          {activities === null ? (
            <div className="space-y-2">
              <div className="skeleton h-10" />
              <div className="skeleton h-10" />
            </div>
          ) : activities.length === 0 ? (
            <p className="text-sm text-slate-500">No activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {activities.map((a) => (
                <li key={a.id} className="text-sm">
                  <div className="text-xs text-slate-500">
                    {a.type} · {new Date(a.created_at).toLocaleDateString()}
                  </div>
                  {a.note}
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link href={`/clients/${client.id}`} className="mt-auto rounded-lg bg-brand-600 py-2 text-center text-sm font-medium text-white hover:bg-brand-500">
          Open full profile
        </Link>
      </aside>
    </div>
  );
}

export function ClientsTable({ clients: allClients, columns, canDelete }: { clients: Row[]; columns: SortColumn[]; canDelete: boolean }) {
  // Clients in their "Undo" window are hidden right away.
  const deleted = usePendingDeletes();
  const clients = allClients.filter((c) => !deleted.has(c.id));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [quick, setQuick] = useState<Row | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();

  const ids = clients.map((c) => c.id);
  const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  function run(action: () => Promise<{ error?: string; ok?: boolean }>, success: string) {
    start(async () => {
      const r = await action();
      if (r.error) toast.error(r.error);
      else {
        toast.success(success);
        setSelected(new Set());
      }
      setConfirming(false);
    });
  }

  return (
    <>
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-brand-50 px-4 py-2.5 text-sm dark:bg-brand-950">
          <span className="font-medium">{selected.size} selected</span>
          <select
            defaultValue=""
            disabled={pending}
            onChange={(e) => e.target.value && run(() => bulkSetStatus([...selected], e.target.value), "Stage updated")}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">Move to stage…</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          {canDelete &&
            (confirming ? (
              <button
                disabled={pending}
                onClick={() => {
                  const n = selected.size;
                  deleteClientsWithUndo([...selected], n === 1 ? "Client deleted" : `${n} clients deleted`);
                  setSelected(new Set());
                  setConfirming(false);
                }}
                className="rounded-lg bg-red-600 px-3 py-1 text-white disabled:opacity-60"
              >
                Confirm delete {selected.size}
              </button>
            ) : (
              <button onClick={() => setConfirming(true)} className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1 text-red-600">
                <Trash2 size={14} /> Delete
              </button>
            ))}
          <button onClick={() => { setSelected(new Set()); setConfirming(false); }} className="ml-auto text-slate-500 hover:underline">
            Clear
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 md:overflow-visible dark:border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500 [&_th]:sticky [&_th]:top-[57px] [&_th]:z-10 [&_th]:bg-slate-50 dark:[&_th]:bg-slate-900">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={allSelected}
                  onChange={() => setSelected(allSelected ? new Set() : new Set(ids))}
                />
              </th>
              {columns.map((c) => (
                <th key={c.key} className={`px-4 py-3 ${c.right ? "text-right" : ""}`}>
                  <Link href={c.href} className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100">
                    {c.label}
                    {c.dir === "asc" ? <ArrowUp size={12} /> : c.dir === "desc" ? <ArrowDown size={12} /> : <ArrowUpDown size={12} className="opacity-40" />}
                  </Link>
                </th>
              ))}
              <th className="w-12 px-2 py-3" />
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr
                key={c.id}
                className={`border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 ${selected.has(c.id) ? "bg-brand-50/60 dark:bg-brand-950/40" : ""}`}
              >
                <td className="px-4 py-3">
                  <input type="checkbox" aria-label={`Select ${c.name}`} checked={selected.has(c.id)} onChange={() => toggle(c.id)} />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/clients/${c.id}`} className="flex items-center gap-3">
                    <Avatar name={c.name} size={32} />
                    <span>
                      <span className="block font-medium text-brand-600 hover:underline">{c.name}</span>
                      <span className="block text-xs text-slate-500">{c.email}</span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3">{c.company}</td>
                <td className="px-4 py-3">
                  <StatusPill status={c.status} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{money(c.value)}</td>
                <td className="px-2 py-3">
                  <button onClick={() => setQuick(c)} aria-label={`Quick view ${c.name}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800">
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {quick && <QuickView client={quick} onClose={() => setQuick(null)} />}
    </>
  );
}
