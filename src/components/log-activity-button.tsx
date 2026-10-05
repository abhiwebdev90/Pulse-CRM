"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";
import { addActivity, type ActionResult } from "@/lib/actions/clients";
import { ACTIVITY_TYPES } from "@/lib/types";

const field =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900";

// Compact "log activity" dialog used from pipeline cards. Stops pointer events so it never starts a drag.
export function LogActivityButton({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(
    async (prev: ActionResult | undefined, formData: FormData) => {
      const result = await addActivity(clientId, prev, formData);
      if (result.ok) {
        toast.success(`Activity logged for ${clientName}`);
        setOpen(false);
      }
      return result;
    },
    undefined,
  );

  useEffect(() => {
    if (open) ref.current?.showModal();
    else ref.current?.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={`Log activity for ${clientName}`}
        title="Log activity"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800"
      >
        <MessageSquarePlus size={15} />
      </button>
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        onPointerDown={(e) => e.stopPropagation()}
        className="m-auto w-full max-w-sm rounded-xl p-0 backdrop:bg-black/40 dark:bg-slate-950 dark:text-slate-100"
      >
        {open && (
          <form action={action} className="space-y-3 p-5">
            <h2 className="font-semibold">Log activity · {clientName}</h2>
            <select name="type" className={field}>
              {ACTIVITY_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <textarea name="note" required rows={3} autoFocus placeholder="What happened?" className={field} />
            {state?.error && (
              <p role="alert" className="text-sm text-red-600">
                {state.error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button disabled={pending} className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">
                {pending ? "Saving…" : "Log"}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
