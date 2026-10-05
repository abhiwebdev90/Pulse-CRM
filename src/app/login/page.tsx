import { AuthForm } from "@/components/auth-form";
import { SignedInNotice } from "@/components/signed-in-notice";
import { safeNext } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string; expired?: string }> }) {
  const { next, expired } = await searchParams;
  const dest = next ? safeNext(next, "") : "";

  // A rejected/expired session still looks "signed in" locally, so only trust a server-validated user.
  const supabase = await createClient();
  const { data: { user } } = expired ? { data: { user: null } } : await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      {user ? (
        <SignedInNotice email={user.email ?? "your account"} mode="login" next={dest || undefined} />
      ) : (
        <>
          {expired && (
            <p role="status" className="w-full max-w-sm rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              Your session expired. Please sign in again.
            </p>
          )}
          <AuthForm mode="login" next={dest || undefined} />
        </>
      )}
    </main>
  );
}
