"use client";

import { useActionState, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { ACCENTS, type Accent } from "@/lib/accents";
import type { ActionResult } from "@/lib/actions/clients";
import { updateProfile, updateWorkspace } from "@/lib/actions/workspace";

const field =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900";

function useSavingAction(action: (p: ActionResult | undefined, f: FormData) => Promise<ActionResult>, message: string) {
  return useActionState(async (prev: ActionResult | undefined, fd: FormData) => {
    const r = await action(prev, fd);
    if (r.ok) toast.success(message);
    return r;
  }, undefined);
}

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [state, action, pending] = useSavingAction(updateProfile, "Profile saved");
  return (
    <form action={action} className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block text-slate-500">Full name</span>
        <input name="full_name" defaultValue={name} required className={field} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-slate-500">Email</span>
        <input value={email} disabled readOnly className={field} />
      </label>
      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      <button disabled={pending} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}

export function WorkspaceForm({ name, accent, canEdit }: { name: string; accent: Accent; canEdit: boolean }) {
  const [state, action, pending] = useSavingAction(updateWorkspace, "Workspace saved");
  const [picked, setPicked] = useState<Accent>(accent);

  return (
    <form action={action} className="space-y-4">
      <label className="block text-sm">
        <span className="mb-1 block text-slate-500">Workspace name</span>
        <input name="name" defaultValue={name} required disabled={!canEdit} className={field} />
      </label>

      <fieldset disabled={!canEdit}>
        <legend className="mb-2 text-sm text-slate-500">Accent colour</legend>
        <div className="flex flex-wrap gap-3">
          {(Object.keys(ACCENTS) as Accent[]).map((key) => (
            <label key={key} title={key} className="cursor-pointer">
              <input type="radio" name="accent" value={key} checked={picked === key} onChange={() => setPicked(key)} className="peer sr-only" />
              <span
                style={{ background: ACCENTS[key] }}
                className="flex h-9 w-9 items-center justify-center rounded-full text-white ring-offset-2 ring-offset-white peer-checked:ring-2 peer-focus-visible:ring-2 dark:ring-offset-slate-950"
              >
                {picked === key && <Check size={16} />}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {!canEdit && <p className="text-sm text-slate-500">Only owners and admins can change workspace settings.</p>}
      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      {canEdit && (
        <button disabled={pending} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
          {pending ? "Saving…" : "Save workspace"}
        </button>
      )}
    </form>
  );
}
