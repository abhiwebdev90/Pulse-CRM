"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { moveClient } from "@/lib/actions/clients";
import { STATUSES, type Status } from "@/lib/types";

export function StageSelect({ id, status }: { id: string; status: Status }) {
  const [value, setValue] = useState(status);
  const [pending, start] = useTransition();

  return (
    <select
      value={value}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as Status;
        const prev = value;
        setValue(next);
        start(async () => {
          const r = await moveClient(id, next);
          if (r.error) {
            setValue(prev);
            toast.error(r.error);
          } else toast.success(`Moved to ${next}`);
        });
      }}
      className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm font-medium disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900"
    >
      {STATUSES.map((s) => (
        <option key={s}>{s}</option>
      ))}
    </select>
  );
}
