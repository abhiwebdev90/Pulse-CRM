import { KanbanBoard, type Card } from "@/components/kanban-board";
import { daysSince } from "@/lib/time";
import { getContext } from "@/lib/workspace";

type Row = Omit<Card, "ownerName" | "days"> & { owner_id: string | null; updated_at: string };

export default async function PipelinePage() {
  const { supabase, workspace } = await getContext();
  const base = "id, name, company, value, status, owner_id, updated_at";

  let res = await supabase
    .from("clients")
    .select(`${base}, position`)
    .eq("workspace_id", workspace.id)
    .order("position")
    .order("updated_at", { ascending: false })
    .limit(500);
  // Falls back to stage-only ordering until the position migration has been run.
  if (res.error) {
    res = (await supabase
      .from("clients")
      .select(base)
      .eq("workspace_id", workspace.id)
      .order("updated_at", { ascending: false })
      .limit(500)) as typeof res;
  }
  const rows = (res.data ?? []) as unknown as Row[];

  const ownerIds = [...new Set(rows.map((r) => r.owner_id).filter(Boolean))] as string[];
  const { data: people } = ownerIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", ownerIds)
    : { data: [] };

  const clients: Card[] = rows.map(({ owner_id, updated_at, ...c }) => ({
    ...c,
    ownerName: (people ?? []).find((p) => p.id === owner_id)?.full_name ?? null,
    days: daysSince(updated_at),
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Pipeline</h1>
        <p className="text-sm text-slate-500">Drag cards between stages, or up and down to reorder.</p>
      </div>
      {/* Remount when server data changes so local drag state resyncs. */}
      <KanbanBoard key={clients.map((c) => `${c.id}:${c.status}`).join("|")} clients={clients} />
    </div>
  );
}
