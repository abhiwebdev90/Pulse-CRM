import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ACCENTS, type Accent } from "@/lib/accents";

export type Role = "owner" | "admin" | "member";
export type WorkspaceInfo = { id: string; name: string; plan: "free" | "pro"; role: Role };

export const ACTIVE_WORKSPACE_COOKIE = "active_workspace";

// Current user + active workspace. The active one comes from a cookie (validated against the user's
// memberships), falling back to the most recently joined. Cached per request.
export const getContext = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?expired=1");

  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("role, created_at, workspaces(id, name, plan)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const workspaces: WorkspaceInfo[] = (memberships ?? [])
    .filter((m) => m.workspaces)
    .map((m) => ({ ...(m.workspaces as unknown as Omit<WorkspaceInfo, "role">), role: m.role as Role }));
  if (workspaces.length === 0) redirect("/login?expired=1");

  const wanted = (await cookies()).get(ACTIVE_WORKSPACE_COOKIE)?.value;
  const active = workspaces.find((w) => w.id === wanted) ?? workspaces[0];

  // Separate query so the app keeps working before the accent migration has been run.
  const { data: extra } = await supabase.from("workspaces").select("accent").eq("id", active.id).maybeSingle();
  const accent = (extra?.accent && extra.accent in ACCENTS ? extra.accent : "indigo") as Accent;

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();

  return {
    supabase,
    user,
    workspace: active,
    workspaces,
    role: active.role,
    accent,
    displayName: profile?.full_name ?? user.email?.split("@")[0] ?? "You",
  };
});
