import { AuthForm } from "@/components/auth-form";
import { SignedInNotice } from "@/components/signed-in-notice";
import { safeNext } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const dest = next ? safeNext(next, "") : "";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      {user ? (
        <SignedInNotice email={user.email ?? "your account"} mode="signup" next={dest || undefined} />
      ) : (
        <AuthForm mode="signup" next={dest || undefined} />
      )}
    </main>
  );
}
