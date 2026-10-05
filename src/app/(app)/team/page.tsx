import { Mail } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { CopyButton } from "@/components/copy-button";
import { InviteForm } from "@/components/invite-form";
import { RemoveMemberButton } from "@/components/remove-member-button";
import { revokeInvite, setMemberRole } from "@/lib/actions/team";
import { getContext, type Role } from "@/lib/workspace";

const roleStyle: Record<Role, string> = {
  owner: "bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300",
  admin: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  member: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

export default async function TeamPage() {
  const { supabase, user, role, workspace } = await getContext();
  const canManage = role !== "member";
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const { data } = await supabase
    .from("workspace_members")
    .select("user_id, role")
    .eq("workspace_id", workspace.id)
    .order("created_at");
  const memberRows = data ?? [];
  const ids = memberRows.map((m) => m.user_id);

  // workspace_members.user_id points at auth.users, so names are looked up in profiles separately.
  // `email` only exists after migration 002, so fall back gracefully.
  let people: { id: string; full_name: string | null; email?: string | null }[] = [];
  const withEmail = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
  if (withEmail.error) {
    people = (await supabase.from("profiles").select("id, full_name").in("id", ids)).data ?? [];
  } else people = withEmail.data ?? [];

  const members = memberRows.map((m) => {
    const p = people.find((x) => x.id === m.user_id);
    return { user_id: m.user_id, role: m.role as Role, name: p?.full_name ?? "Member", email: p?.email ?? null };
  });

  const { data: invites } = canManage
    ? await supabase.from("invites").select("id, email, role, token").eq("workspace_id", workspace.id).is("accepted_at", null)
    : { data: [] };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Team</h1>
        <p className="text-sm text-slate-500">
          {members.length} {members.length === 1 ? "member" : "members"} in {workspace.name}
        </p>
      </div>

      <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
        {members.map((m) => (
          <li key={m.user_id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={m.name} size={38} />
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {m.name} {m.user_id === user.id && <span className="font-normal text-slate-500">(you)</span>}
                </div>
                {m.email && <div className="truncate text-xs text-slate-500">{m.email}</div>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {role === "owner" && m.role !== "owner" ? (
                <form
                  action={async (fd: FormData) => {
                    "use server";
                    await setMemberRole(m.user_id, String(fd.get("role")));
                  }}
                  className="flex items-center gap-1"
                >
                  <select name="role" defaultValue={m.role} className="rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900">
                    <option value="admin">admin</option>
                    <option value="member">member</option>
                  </select>
                  <button className="text-xs text-brand-600 hover:underline">Save</button>
                </form>
              ) : (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleStyle[m.role]}`}>{m.role}</span>
              )}
              {canManage && m.role !== "owner" && m.user_id !== user.id && (
                <RemoveMemberButton userId={m.user_id} name={m.name} workspace={workspace.name} />
              )}
            </div>
          </li>
        ))}
      </ul>

      {canManage && (
        <section className="space-y-4">
          <h2 className="font-semibold">Invite someone</h2>
          <InviteForm />

          <div>
            <h3 className="mb-2 text-sm font-medium text-slate-500">Pending invites ({(invites ?? []).length})</h3>
            {(invites ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">No pending invites.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {(invites ?? []).map((i) => {
                  const link = `${origin}/invite/${i.token}`;
                  const mail = `mailto:${i.email}?subject=${encodeURIComponent(`Join ${workspace.name} on PulseCRM`)}&body=${encodeURIComponent(
                    `You've been invited to ${workspace.name}. Sign in with ${i.email} and accept here:\n${link}`,
                  )}`;
                  return (
                    <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <Avatar name={i.email} size={30} />
                        <div>
                          <div>{i.email}</div>
                          <div className="text-xs text-slate-500">Invited as {i.role}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CopyButton text={link} />
                        <a href={mail} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1 text-xs hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                          <Mail size={13} /> Email
                        </a>
                        <form action={revokeInvite.bind(null, i.id)}>
                          <button className="text-xs text-red-600 hover:underline">Revoke</button>
                        </form>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
