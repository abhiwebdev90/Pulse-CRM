import Link from "next/link";
import { redirect } from "next/navigation";
import { acceptInvite } from "@/lib/actions/team";
import { createClient } from "@/lib/supabase/server";

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(token)) redirect("/");

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const signedIn = !!data?.claims;

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-semibold">You&apos;re invited to a PulseCRM workspace</h1>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            This invite is invalid, already used, or was sent to a different email.
          </p>
        )}
        {signedIn ? (
          <form action={acceptInvite.bind(null, token)}>
            <button className="w-full rounded-lg bg-brand-600 py-2 text-sm font-medium text-white">Accept invite</button>
          </form>
        ) : (
          <p className="text-sm text-slate-500">
            <Link href={`/signup?next=${encodeURIComponent(`/invite/${token}`)}`} className="text-brand-600">Create an account</Link> or{" "}
            <Link href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`} className="text-brand-600">sign in</Link> with the invited email, and you will come straight back here.
          </p>
        )}
      </div>
    </main>
  );
}
