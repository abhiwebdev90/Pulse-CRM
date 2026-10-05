"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteClientsWithUndo } from "@/lib/pending-deletes";

export function DeleteClientButton({ id, name }: { id: string; name: string }) {
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  if (!confirming)
    return (
      <button onClick={() => setConfirming(true)} className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600">
        Delete
      </button>
    );
  return (
    <button
      onClick={() => {
        // Hidden everywhere right away; actually deleted after the Undo window unless restored.
        deleteClientsWithUndo([id], `${name} deleted`, () => router.refresh());
        router.push("/clients");
      }}
      className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white"
    >
      Confirm delete
    </button>
  );
}
