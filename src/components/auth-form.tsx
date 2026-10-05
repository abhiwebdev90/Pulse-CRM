"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getDemoCredentials, login, signup } from "@/lib/actions/auth";

const input =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900";

export function AuthForm({ mode, next }: { mode: "login" | "signup"; next?: string }) {
  const [state, action, pending] = useActionState(mode === "login" ? login : signup, undefined);
  const [demoError, setDemoError] = useState<string>();
  const [loadingDemo, setLoadingDemo] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const error = demoError ?? state?.error;
  // Keep the post-login destination (e.g. an invite link) when switching between login and signup.
  const suffix = next ? `?next=${encodeURIComponent(next)}` : "";

  async function fillDemo() {
    setLoadingDemo(true);
    setDemoError(undefined);
    try {
      const creds = await getDemoCredentials();
      if (!creds) return setDemoError("Demo account is not configured");
      if (emailRef.current) emailRef.current.value = creds.email;
      if (passwordRef.current) passwordRef.current.value = creds.password;
      passwordRef.current?.focus();
    } catch {
      setDemoError("Could not load demo details. Try again.");
    } finally {
      setLoadingDemo(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-5">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600">
        <ArrowLeft size={14} /> Back to home
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {next?.startsWith("/invite/")
            ? "Use the email address your invite was sent to."
            : mode === "login"
              ? "Sign in to PulseCRM"
              : "Start with a free workspace"}
        </p>
      </div>

      <form action={action} className="space-y-3">
        {next && <input type="hidden" name="next" value={next} />}
        {mode === "signup" && <input name="full_name" placeholder="Full name" required className={input} />}
        <input ref={emailRef} name="email" type="email" placeholder="Email" required autoComplete="email" className={input} />
        <input
          ref={passwordRef}
          name="password"
          type="password"
          placeholder="Password (min 8 characters)"
          required
          minLength={8}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className={input}
        />
        <button
          disabled={pending}
          className="w-full rounded-lg bg-brand-600 py-2 text-sm font-medium text-white hover:bg-brand-500 disabled:opacity-60"
        >
          {pending ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>

      {mode === "login" && !next?.startsWith("/invite/") && (
        <button
          type="button"
          onClick={fillDemo}
          disabled={loadingDemo || pending}
          className="w-full rounded-lg border border-slate-300 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-900"
        >
          {loadingDemo ? "Loading…" : "Try the demo (fills login details)"}
        </button>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <p className="text-center text-sm text-slate-500">
        {mode === "login" ? (
          <>
            No account? <Link href={`/signup${suffix}`} className="text-brand-600">Sign up</Link>
          </>
        ) : (
          <>
            Have an account? <Link href={`/login${suffix}`} className="text-brand-600">Sign in</Link>
          </>
        )}
      </p>
    </div>
  );
}
