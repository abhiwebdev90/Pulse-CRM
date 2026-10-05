"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getContext } from "@/lib/workspace";
import type { ActionResult } from "@/lib/actions/clients";

export async function inviteMember(_: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const parsed = z
    .object({ email: z.email("Enter a valid email"), role: z.enum(["admin", "member"]) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase, user, workspace, role } = await getContext();
  if (role === "member") return { error: "Only owners and admins can invite" };

  const email = parsed.data.email.toLowerCase();

  // Replace any earlier invite (accepted or pending) for this address. invites has no UPDATE policy,
  // so an upsert would fail on re-invites; delete + insert uses the policies that do exist.
  const { error: clearError } = await supabase.from("invites").delete().eq("workspace_id", workspace.id).eq("email", email);
  if (clearError) return { error: clearError.message };

  const { error } = await supabase.from("invites").insert({
    workspace_id: workspace.id,
    email,
    role: parsed.data.role,
    invited_by: user.id,
  });
  if (error) return { error: error.message };
  revalidatePath("/team");
  return { ok: true };
}

export async function revokeInvite(id: string) {
  const { supabase } = await getContext();
  await supabase.from("invites").delete().eq("id", id);
  revalidatePath("/team");
}

export async function removeMember(userId: string): Promise<ActionResult> {
  const { supabase, workspace, user } = await getContext();
  if (userId === user.id) return { error: "You can't remove yourself" };
  const { error, count } = await supabase
    .from("workspace_members")
    .delete({ count: "exact" })
    .eq("workspace_id", workspace.id)
    .eq("user_id", userId);
  if (error || !count) return { error: "Couldn't remove this member. Only owners and admins can remove non-owners." };
  revalidatePath("/team");
  return { ok: true };
}

export async function setMemberRole(userId: string, role: string) {
  if (role !== "admin" && role !== "member") return;
  const { supabase, workspace } = await getContext();
  await supabase.from("workspace_members").update({ role }).eq("workspace_id", workspace.id).eq("user_id", userId);
  revalidatePath("/team");
}

export async function acceptInvite(token: string) {
  const { supabase } = await getContext();
  const { error } = await supabase.rpc("accept_invite", { invite_token: token });
  if (error) redirect(`/invite/${token}?error=1`);
  redirect("/dashboard");
}
