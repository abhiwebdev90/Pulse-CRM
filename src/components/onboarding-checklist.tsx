"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";

export type ChecklistItem = { label: string; hint: string; href: string; done: boolean };

const EVENT = "onboarding-dismissed-change";

function useDismissed(key: string) {
  return useSyncExternalStore(
    (listener) => {
      window.addEventListener("storage", listener);
      window.addEventListener(EVENT, listener);
      return () => {
        window.removeEventListener("storage", listener);
        window.removeEventListener(EVENT, listener);
      };
    },
    () => {
      try {
        return localStorage.getItem(key) === "1";
      } catch {
        return false;
      }
    },
    () => true, // render nothing on the server, so it never flashes for people who dismissed it
  );
}

export function OnboardingChecklist({ workspaceId, items }: { workspaceId: string; items: ChecklistItem[] }) {
  const key = `onboarding-dismissed:${workspaceId}`;
  const dismissed = useDismissed(key);
  const done = items.filter((i) => i.done).length;

  if (dismissed || done === items.length) return null;

  return (
    <section className="rounded-xl border border-brand-200 bg-brand-50/60 p-5 dark:border-brand-900 dark:bg-brand-950/40">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">Get set up</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {done} of {items.length} done. A few quick steps to get the most from PulseCRM.
          </p>
        </div>
        <button
          onClick={() => {
            try {
              localStorage.setItem(key, "1");
            } catch {
              // storage unavailable: it will simply show again next visit
            }
            window.dispatchEvent(new Event(EVENT));
          }}
          aria-label="Hide checklist"
          className="rounded-lg p-1.5 text-slate-500 hover:bg-white/60 dark:hover:bg-slate-800"
        >
          <X size={16} />
        </button>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white dark:bg-slate-800">
        <div className="h-full rounded-full bg-brand-600 transition-[width] duration-500" style={{ width: `${(done / items.length) * 100}%` }} />
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {items.map((i) => (
          <li key={i.label}>
            <Link
              href={i.href}
              className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                i.done
                  ? "border-transparent bg-white/50 text-slate-500 dark:bg-slate-900/40"
                  : "border-slate-200 bg-white hover:border-brand-300 dark:border-slate-700 dark:bg-slate-900"
              }`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  i.done ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 dark:border-slate-600"
                }`}
              >
                {i.done && <Check size={12} />}
              </span>
              <span>
                <span className={`block text-sm font-medium ${i.done ? "line-through" : ""}`}>{i.label}</span>
                <span className="block text-xs text-slate-500">{i.hint}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
