import Image from "next/image";

export type ScreenName = "dashboard" | "pipeline" | "clients";

// Browser-window frame around a real product screenshot. Light and dark variants are swapped with CSS,
// so the correct one shows instantly with the page theme and no layout shift.
export function ScreenFrame({ name, alt, priority = false }: { name: ScreenName; alt: string; priority?: boolean }) {
  const common = { width: 2160, height: 1020, priority, sizes: "(min-width: 1024px) 896px, 100vw", className: "h-auto w-full" } as const;
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-brand-900/10 dark:border-slate-800 dark:bg-slate-950">
      <div aria-hidden="true" className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="ml-3 rounded-md bg-white px-3 py-0.5 text-[10px] text-slate-400 dark:bg-slate-800">app.pulsecrm.dev</span>
      </div>
      <Image src={`/screens/${name}-light.webp`} alt={alt} {...common} className={`${common.className} dark:hidden`} />
      <Image src={`/screens/${name}-dark.webp`} alt={alt} {...common} className={`${common.className} hidden dark:block`} />
    </div>
  );
}
