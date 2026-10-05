import type { Status } from "@/lib/types";

const colors: Record<Status, string> = {
  New: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  Contacted: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  "Proposal Sent": "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  Won: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  Lost: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export const StatusPill = ({ status }: { status: Status }) => (
  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[status]}`}>{status}</span>
);
