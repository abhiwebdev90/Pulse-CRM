const palette = [
  "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300",
];

// Stable colour per name so the same person always gets the same avatar.
function hash(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

export function initials(name: string | null | undefined) {
  const parts = (name ?? "?").replace(/^(mr|mrs|ms|miss|dr)\.?\s+/i, "").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function Avatar({ name, size = 32 }: { name: string | null | undefined; size?: number }) {
  return (
    <span
      title={name ?? undefined}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.4) }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-medium ${palette[hash(name ?? "?") % palette.length]}`}
    >
      {initials(name)}
    </span>
  );
}
