import { ProfileForm, WorkspaceForm } from "@/components/settings-forms";
import { getContext } from "@/lib/workspace";

const card = "rounded-xl border border-slate-200 p-5 dark:border-slate-800";

export default async function SettingsPage() {
  const { user, displayName, workspace, accent, role } = await getContext();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section className={card}>
        <h2 className="mb-4 font-semibold">Your profile</h2>
        <ProfileForm name={displayName} email={user.email ?? ""} />
      </section>

      <section className={card}>
        <h2 className="mb-4 font-semibold">Workspace</h2>
        <WorkspaceForm name={workspace.name} accent={accent} canEdit={role !== "member"} />
      </section>
    </div>
  );
}
