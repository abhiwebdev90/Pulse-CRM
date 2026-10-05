"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, KanbanSquare, LayoutDashboard, ListChecks, Search, Settings, Users, UsersRound } from "lucide-react";
import { searchClients, type SearchHit } from "@/lib/actions/workspace";

const pages = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/activity", label: "Activity", icon: ListChecks },
  { href: "/team", label: "Team", icon: UsersRound },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [index, setIndex] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  // Ctrl/Cmd+K toggles the palette from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);

  // Debounced client search; stale responses are ignored.
  useEffect(() => {
    let current = true;
    const t = setTimeout(async () => {
      const r = await searchClients(q);
      if (current) setHits(r);
    }, 200);
    return () => {
      current = false;
      clearTimeout(t);
    };
  }, [q]);

  const term = q.trim().toLowerCase();
  const matchedPages = pages.filter((p) => !term || p.label.toLowerCase().includes(term));
  const items = [
    ...hits.map((h) => ({ key: h.id, href: `/clients/${h.id}`, label: h.name, sub: h.company, icon: Users })),
    ...matchedPages.map((p) => ({ key: p.href, href: p.href, label: p.label, sub: "Go to page", icon: p.icon })),
  ];

  function go(href: string) {
    setOpen(false);
    setQ("");
    setHits([]);
    setIndex(0);
    router.push(href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50 sm:w-64 dark:border-slate-800 dark:hover:bg-slate-900"
      >
        <Search size={15} />
        <span className="hidden flex-1 text-left sm:inline">Search…</span>
        <kbd className="hidden rounded border border-slate-200 px-1.5 text-xs sm:inline dark:border-slate-700">Ctrl K</kbd>
      </button>

      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === dialog.current && setOpen(false)}
        className="m-auto mt-[12vh] w-full max-w-lg rounded-xl p-0 backdrop:bg-black/40 dark:bg-slate-950 dark:text-slate-100"
      >
        {open && (
          <div>
            <div className="flex items-center gap-2 border-b border-slate-200 px-4 dark:border-slate-800">
              <Search size={16} className="text-slate-400" />
              <input
                autoFocus
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setIndex((i) => Math.min(i + 1, items.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setIndex((i) => Math.max(i - 1, 0));
                  } else if (e.key === "Enter" && items[index]) go(items[index].href);
                }}
                placeholder="Search clients or jump to a page…"
                className="w-full bg-transparent py-3 text-sm outline-none"
              />
            </div>
            <ul className="max-h-80 overflow-y-auto p-2">
              {items.length === 0 && <li className="p-4 text-center text-sm text-slate-500">No results</li>}
              {items.map((it, i) => (
                <li key={it.key}>
                  <button
                    onMouseEnter={() => setIndex(i)}
                    onClick={() => go(it.href)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${
                      i === index ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300" : ""
                    }`}
                  >
                    <it.icon size={16} className="shrink-0" />
                    <span className="flex-1 truncate">{it.label}</span>
                    {it.sub && <span className="truncate text-xs text-slate-500">{it.sub}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </dialog>
    </>
  );
}
