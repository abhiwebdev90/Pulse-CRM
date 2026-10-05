"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";

export type AuthState = { error?: string } | undefined;

const credentials = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function login(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentials.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Invalid email or password" };
  redirect(safeNext(formData.get("next")));
}

export async function signup(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentials
    .extend({ full_name: z.string().trim().min(2, "Enter your name") })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { full_name, email, password } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name } },
  });
  if (error) return { error: error.message };
  if (!data.session) return { error: "Check your email to confirm your account, then sign in." };
  redirect(safeNext(formData.get("next")));
}

// Returned on demand so the demo password is not baked into the page or JS bundle.
export async function getDemoCredentials(): Promise<{ email: string; password: string } | null> {
  const email = process.env.DEMO_EMAIL;
  const password = process.env.DEMO_PASSWORD;
  return email && password ? { email, password } : null;
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Signs out and sends the user to the page they were trying to reach (login or signup).
export async function signOutTo(formData: FormData) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const target = formData.get("to") === "signup" ? "/signup" : "/login";
  const next = formData.get("next");
  redirect(typeof next === "string" && next ? `${target}?next=${encodeURIComponent(safeNext(next, "/dashboard"))}` : target);
}
