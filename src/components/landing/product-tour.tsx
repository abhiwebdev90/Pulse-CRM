"use client";

import { useState } from "react";
import { ScreenFrame, type ScreenName } from "@/components/landing/screen-frame";

const tabs: { id: ScreenName; label: string; blurb: string; alt: string }[] = [
  { id: "dashboard", label: "Dashboard", blurb: "Revenue, win rate and trends against the previous period, plus who needs a follow-up today.", alt: "PulseCRM dashboard with revenue stats and charts" },
  { id: "pipeline", label: "Pipeline", blurb: "Drag deals between stages, reorder within a stage, and spot stale deals at a glance.", alt: "PulseCRM pipeline board with deals in five stages" },
  { id: "clients", label: "Clients", blurb: "Search, filter, sort, bulk-edit and export every client, with a quick-view panel for details.", alt: "PulseCRM clients table" },
];

export function ProductTour() {
  const [active, setActive] = useState<ScreenName>("dashboard");
  const current = tabs.find((t) => t.id === active)!;

  return (
    <div>
      <div role="tablist" aria-label="Product tour" className="mx-auto mb-6 flex w-fit gap-1 rounded-xl border border-slate-200 p-1 dark:border-slate-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setActive(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              active === t.id ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="mx-auto mb-8 min-h-14 max-w-xl text-center text-slate-600 dark:text-slate-400">{current.blurb}</p>

      {/* All panels stay mounted and stacked so switching cross-fades instead of reloading images. */}
      <div className="mx-auto grid max-w-4xl">
        {tabs.map((t) => (
          <div
            key={t.id}
            id={`panel-${t.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${t.id}`}
            aria-hidden={active !== t.id}
            className={`col-start-1 row-start-1 transition-all duration-500 ${active === t.id ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"}`}
          >
            <ScreenFrame name={t.id} alt={t.alt} />
          </div>
        ))}
      </div>
    </div>
  );
}
