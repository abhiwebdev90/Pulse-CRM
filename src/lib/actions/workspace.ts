"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ACCENTS } from "@/lib/accents";
import type { ActionResult } from "@/lib/actions/clients";
import { ACTIVE_WORKSPACE_COOKIE, getContext } from "@/lib/workspace";

export async function switchWorkspace(id: string) {
  const { workspaces } = await getContext();
  if (!workspaces.some((w) => w.id === id)) return;
  (await cookies()).set(ACTIVE_WORKSPACE_COOKIE, id, { path: "/", httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
}

export async function updateWorkspace(_: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Workspace name is too short").max(60),
      accent: z.enum(Object.keys(ACCENTS) as [keyof typeof ACCENTS, ...(keyof typeof ACCENTS)[]]),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase, workspace, role } = await getContext();
  if (role === "member") return { error: "Only owners and admins can change workspace settings" };

  const { error: nameError } = await supabase.from("workspaces").update({ name: parsed.data.name }).eq("id", workspace.id);
  if (nameError) return { error: nameError.message };

  const { error: accentError } = await supabase.from("workspaces").update({ accent: parsed.data.accent }).eq("id", workspace.id);
  if (accentError) {
    return {
      error: accentError.message.includes("accent")
        ? "Name saved. Run supabase/migrations/002_profile_email_accent.sql to enable accent colours."
        : accentError.message,
    };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateProfile(_: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const parsed = z.object({ full_name: z.string().trim().min(2, "Enter your name").max(80) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase, user } = await getContext();
  const { error } = await supabase.from("profiles").update({ full_name: parsed.data.full_name }).eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export type SearchHit = { id: string; name: string; company: string | null };

// Powers the command palette. Characters with meaning in PostgREST filters are stripped.
export async function searchClients(q: string): Promise<SearchHit[]> {
  const term = q.replace(/[%_,()*\\]/g, " ").trim().slice(0, 60);
  if (term.length < 2) return [];
  const { supabase, workspace } = await getContext();
  const { data } = await supabase
    .from("clients")
    .select("id, name, company")
    .eq("workspace_id", workspace.id)
    .or(`name.ilike.%${term}%,company.ilike.%${term}%,email.ilike.%${term}%`)
    .limit(8);
  return data ?? [];
}
