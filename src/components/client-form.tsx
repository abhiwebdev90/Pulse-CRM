"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { saveClient, type ActionResult } from "@/lib/actions/clients";
import { STATUSES, type Client } from "@/lib/types";

const field =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900";

export function ClientFormButton({ client }: { client?: Client }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(
    async (prev: ActionResult | undefined, formData: FormData) => {
      const result = await saveClient(client?.id ?? null, prev, formData);
      if (result.ok) {
        toast.success(client ? "Client updated" : "Client added");
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
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-500"
      >
        {!client && <Plus size={16} />} {client ? "Edit" : "New client"}
      </button>
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        className="m-auto w-full max-w-md rounded-xl p-0 backdrop:bg-black/40 dark:bg-slate-950 dark:text-slate-100"
      >
        {open && (
          <form action={action} className="space-y-3 p-5">
            <h2 className="text-lg font-semibold">{client ? "Edit client" : "New client"}</h2>
            <input name="name" placeholder="Name" required defaultValue={client?.name} className={field} />
            <input name="company" placeholder="Company" defaultValue={client?.company ?? ""} className={field} />
            <input name="email" type="email" placeholder="Email" defaultValue={client?.email ?? ""} className={field} />
            <input name="phone" placeholder="Phone" defaultValue={client?.phone ?? ""} className={field} />
            <div className="grid grid-cols-2 gap-3">
              <select name="status" defaultValue={client?.status ?? "New"} className={field}>
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <input name="value" type="number" min={0} placeholder="Deal value" defaultValue={client?.value ?? 0} className={field} />
            </div>
            {state?.error && (
              <p role="alert" className="text-sm text-red-600">
                {state.error}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button disabled={pending} className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">
                {pending ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
