import Link from "next/link";
import { signOutTo } from "@/lib/actions/auth";

// Shown on /login and /signup when someone is already signed in, instead of silently bouncing them to the app.
export function SignedInNotice({ email, mode, next }: { email: string; mode: "login" | "signup"; next?: string }) {
  return (
    <div className="w-full max-w-sm space-y-5 text-center">
      <div>
        <h1 className="text-2xl font-semibold">You&apos;re already signed in</h1>
        <p className="mt-2 text-sm text-slate-500">
          Signed in as <span className="font-medium text-slate-700 dark:text-slate-300">{email}</span>.
          {mode === "signup" ? " To create a new account, sign out first." : " To use a different account, sign out first."}
        </p>
      </div>
      <Link href={next ?? "/dashboard"} className="block rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-500">
        Continue to dashboard
      </Link>
      <form action={signOutTo}>
        <input type="hidden" name="to" value={mode} />
        {next && <input type="hidden" name="next" value={next} />}
        <button className="w-full rounded-lg border border-slate-300 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900">
          {mode === "signup" ? "Sign out and create an account" : "Sign out and switch account"}
        </button>
      </form>
      <Link href="/" className="inline-block text-sm text-slate-500 hover:text-brand-600">
        ← Back to home
      </Link>
    </div>
  );
}
