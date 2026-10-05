"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { removeMember } from "@/lib/actions/team";

export function RemoveMemberButton({ userId, name, workspace }: { userId: string; name: string; workspace: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) ref.current?.showModal();
    else ref.current?.close();
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-red-600 hover:underline">
        Remove
      </button>
      <dialog
        ref={ref}
        onClose={() => !pending && setOpen(false)}
        onCancel={(e) => pending && e.preventDefault()}
        className="m-auto w-full max-w-sm rounded-xl p-0 backdrop:bg-black/40 dark:bg-slate-950 dark:text-slate-100"
      >
        {open && (
          <div className="space-y-4 p-5">
            <div>
              <h2 className="font-semibold">Remove {name}?</h2>
              <p className="mt-1 text-sm text-slate-500">
                They will lose access to {workspace} and its clients straight away. You can invite them again later.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm hover:bg-slate-100 disabled:opacity-60 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    try {
                      const result = await removeMember(userId);
                      if (result.error) toast.error(result.error);
                      else toast.success(`${name} removed`);
                      setOpen(false);
                    } catch {
                      toast.error("Could not remove member. Try again.");
                    }
                  })
                }
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {pending ? "Removing…" : "Remove member"}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
