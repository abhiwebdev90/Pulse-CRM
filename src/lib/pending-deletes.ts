"use client";

import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { bulkDelete } from "@/lib/actions/clients";

// Clients waiting out the "Undo" window. They are hidden from lists immediately and only deleted for real
// once the toast expires. Lives at module level so it survives client-side navigation (e.g. delete, then go to /clients).
let pending: ReadonlySet<string> = new Set();
const listeners = new Set<() => void>();
const EMPTY: ReadonlySet<string> = new Set();

function update(change: (next: Set<string>) => void) {
  const next = new Set(pending);
  change(next);
  pending = next;
  listeners.forEach((l) => l());
}

export function usePendingDeletes() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => pending,
    () => EMPTY,
  );
}

const UNDO_MS = 6000;

export function deleteClientsWithUndo(ids: string[], label: string, onUndo?: () => void) {
  update((s) => ids.forEach((id) => s.add(id)));
  let settled = false;

  const release = () => update((s) => ids.forEach((id) => s.delete(id)));

  const commit = async () => {
    if (settled) return;
    settled = true;
    const result = await bulkDelete(ids);
    release();
    if (result.error) toast.error(result.error);
  };

  toast(label, {
    duration: UNDO_MS,
    action: {
      label: "Undo",
      onClick: () => {
        if (settled) return;
        settled = true;
        release();
        onUndo?.();
        toast.success("Restored");
      },
    },
    onAutoClose: commit,
    onDismiss: commit,
  });
}
