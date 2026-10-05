"use client";

import { useActionState, useEffect, useRef } from "react";
import { addActivity } from "@/lib/actions/clients";
import { ACTIVITY_TYPES } from "@/lib/types";

export function ActivityForm({ clientId }: { clientId: string }) {
  const [state, action, pending] = useActionState(addActivity.bind(null, clientId), undefined);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-2">
      <div className="flex gap-2">
        <select name="type" className="rounded-lg border border-slate-300 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
          {ACTIVITY_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <input
          name="note"
          placeholder="Log a call, email, meeting or note…"
          required
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <button disabled={pending} className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">
          {pending ? "…" : "Add"}
        </button>
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
    </form>
  );
}
