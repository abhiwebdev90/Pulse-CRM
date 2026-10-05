import { AppShell } from "@/components/app-shell";
import { ACCENTS } from "@/lib/accents";
import { daysSince, isoDaysAgo } from "@/lib/time";
import { getContext } from "@/lib/workspace";

const STALE_DAYS = 14;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, workspace, workspaces, accent, displayName } = await getContext();

  const cutoff = isoDaysAgo(STALE_DAYS);
  const { data: stale, count } = await supabase
    .from("clients")
    .select("id, name, last_contact", { count: "exact" })
    .eq("workspace_id", workspace.id)
    .not("status", "in", "(Won,Lost)")
    .lt("last_contact", cutoff)
    .order("last_contact")
    .limit(6);

  const followUps = (stale ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    days: daysSince(c.last_contact),
  }));

  return (
    <div style={{ "--brand": ACCENTS[accent] } as React.CSSProperties}>
      <AppShell
        user={{ name: displayName, email: user.email ?? "" }}
        workspace={workspace}
        workspaces={workspaces}
        followUps={followUps}
        followUpTotal={count ?? 0}
      >
        {children}
      </AppShell>
    </div>
  );
}
