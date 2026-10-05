"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { inviteMember } from "@/lib/actions/team";

export function InviteForm() {
  const [state, action, pending] = useActionState(inviteMember, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      toast.success("Invite created. Share the link below.");
      ref.current?.reset();
    }
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-2">
      <div className="flex gap-2">
        <input name="email" type="email" required placeholder="teammate@company.com" className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
        <select name="role" className="rounded-lg border border-slate-300 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
        <button disabled={pending} className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">
          {pending ? "…" : "Invite"}
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
