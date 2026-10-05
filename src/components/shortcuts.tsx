"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Keyboard } from "lucide-react";

const goTo: Record<string, { href: string; label: string }> = {
  d: { href: "/dashboard", label: "Dashboard" },
  c: { href: "/clients", label: "Clients" },
  p: { href: "/pipeline", label: "Pipeline" },
  a: { href: "/activity", label: "Activity" },
  t: { href: "/team", label: "Team" },
  b: { href: "/billing", label: "Billing" },
  s: { href: "/settings", label: "Settings" },
};

const isTyping = (el: EventTarget | null) => {
  const t = el as HTMLElement | null;
  return !!t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));
};

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 font-mono text-xs dark:border-slate-700 dark:bg-slate-900">
      {children}
    </kbd>
  );
}

export function Shortcuts() {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const lastG = useRef(0);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target) || document.querySelector("dialog[open]")) return;
      if (e.key === "?") {
        e.preventDefault();
        setOpen(true);
        return;
      }
      const key = e.key.toLowerCase();
      if (key === "g") {
        lastG.current = Date.now();
      } else if (Date.now() - lastG.current < 1200 && goTo[key]) {
        lastG.current = 0;
        router.push(goTo[key].href);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Keyboard shortcuts"
        title="Keyboard shortcuts (?)"
        className="hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 sm:block dark:text-slate-400 dark:hover:bg-slate-800"
      >
        <Keyboard size={18} />
      </button>
      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === dialog.current && setOpen(false)}
        className="m-auto w-full max-w-md rounded-xl p-0 backdrop:bg-black/40 dark:bg-slate-950 dark:text-slate-100"
      >
        {open && (
          <div className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Keyboard shortcuts</h2>
              <button onClick={() => setOpen(false)} className="text-sm text-slate-500 hover:underline">
                Close
              </button>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between">
                <span>Search clients and pages</span>
                <span className="flex gap-1"><Kbd>Ctrl</Kbd><Kbd>K</Kbd></span>
              </li>
              <li className="flex items-center justify-between">
                <span>Show this help</span>
                <Kbd>?</Kbd>
              </li>
            </ul>
            <div>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Go to (press G, then…)</h3>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {Object.entries(goTo).map(([key, { label }]) => (
                  <li key={key} className="flex items-center justify-between">
                    <span>{label}</span>
                    <span className="flex gap-1"><Kbd>G</Kbd><Kbd>{key.toUpperCase()}</Kbd></span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
