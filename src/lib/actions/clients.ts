"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getContext } from "@/lib/workspace";
import { ACTIVITY_TYPES, STATUSES } from "@/lib/types";

export type ActionResult = { error?: string; ok?: boolean };

const clientSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  company: z.string().trim().max(120).optional(),
  email: z.union([z.email("Enter a valid email"), z.literal("")]).optional(),
  phone: z.string().trim().max(40).optional(),
  status: z.enum(STATUSES).default("New"),
  value: z.coerce.number().min(0).max(1e9).default(0),
});

const clean = (v: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(v).map(([k, x]) => [k, x === "" ? null : x]));

const friendly = (message: string) =>
  message.startsWith("PLAN_LIMIT") ? message.replace("PLAN_LIMIT: ", "") : message;

export async function saveClient(
  id: string | null,
  _: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase, user, workspace } = await getContext();
  const values = clean(parsed.data);
  const { error } = id
    ? await supabase.from("clients").update(values).eq("id", id)
    : await supabase.from("clients").insert({ ...values, workspace_id: workspace.id, owner_id: user.id });
  if (error) return { error: friendly(error.message) };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function moveClient(id: string, status: string): Promise<ActionResult> {
  if (!(STATUSES as readonly string[]).includes(status)) return { error: "Invalid status" };
  const { supabase } = await getContext();
  const { error } = await supabase
    .from("clients")
    .update({ status, last_contact: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

// Saves a card's stage and the full order of the column it landed in.
export async function placeClient(
  id: string,
  status: string,
  orderedIds: string[],
  statusChanged: boolean,
): Promise<ActionResult> {
  const uuid = /^[0-9a-f-]{36}$/i;
  if (!(STATUSES as readonly string[]).includes(status)) return { error: "Invalid status" };
  if (!uuid.test(id) || orderedIds.length > 500 || !orderedIds.every((x) => uuid.test(x)) || !orderedIds.includes(id))
    return { error: "Invalid request" };

  const { supabase } = await getContext();
  if (statusChanged) {
    const { error } = await supabase
      .from("clients")
      .update({ status, last_contact: new Date().toISOString() })
      .eq("id", id);
    if (error) return { error: error.message };
  }

  const results = await Promise.all(
    orderedIds.map((cid, position) => supabase.from("clients").update({ position }).eq("id", cid)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) {
    return {
      error: failed.error.message.includes("position")
        ? "Card order not saved: run supabase/migrations/001_client_position.sql"
        : failed.error.message,
    };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteClient(id: string): Promise<ActionResult> {
  const { supabase } = await getContext();
  const { error, count } = await supabase.from("clients").delete({ count: "exact" }).eq("id", id);
  if (error || !count) return { error: "Only owners and admins can delete clients" };
  revalidatePath("/", "layout");
  return { ok: true };
}

const activitySchema = z.object({
  type: z.enum(ACTIVITY_TYPES),
  note: z.string().trim().min(1, "Write a note").max(2000),
});

export async function addActivity(
  clientId: string,
  _: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = activitySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { supabase, user, workspace } = await getContext();
  const { error } = await supabase.from("activities").insert({
    ...parsed.data,
    client_id: clientId,
    workspace_id: workspace.id,
    created_by: user.id,
  });
  if (error) return { error: error.message };
  await supabase.from("clients").update({ last_contact: new Date().toISOString() }).eq("id", clientId);
  revalidatePath(`/clients/${clientId}`);
  return { ok: true };
}

const uuidList = z.array(z.string().regex(/^[0-9a-f-]{36}$/i)).min(1).max(200);

export async function bulkSetStatus(ids: string[], status: string): Promise<ActionResult> {
  const list = uuidList.safeParse(ids);
  if (!list.success || !(STATUSES as readonly string[]).includes(status)) return { error: "Invalid request" };
  const { supabase, workspace } = await getContext();
  const { error } = await supabase
    .from("clients")
    .update({ status, last_contact: new Date().toISOString() })
    .in("id", list.data)
    .eq("workspace_id", workspace.id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function bulkDelete(ids: string[]): Promise<ActionResult> {
  const list = uuidList.safeParse(ids);
  if (!list.success) return { error: "Invalid request" };
  const { supabase, workspace } = await getContext();
  const { error, count } = await supabase
    .from("clients")
    .delete({ count: "exact" })
    .in("id", list.data)
    .eq("workspace_id", workspace.id);
  if (error || !count) return { error: "Only owners and admins can delete clients" };
  revalidatePath("/", "layout");
  return { ok: true };
}

export type QuickActivity = { id: string; type: string; note: string; created_at: string };

export async function getRecentActivities(clientId: string): Promise<QuickActivity[]> {
  if (!/^[0-9a-f-]{36}$/i.test(clientId)) return [];
  const { supabase } = await getContext();
  const { data } = await supabase
    .from("activities")
    .select("id, type, note, created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(5);
  return data ?? [];
}
