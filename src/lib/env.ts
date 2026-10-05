// Reports misconfigured Supabase settings in plain words (names only, never values), so a bad deployment
// shows a clear message instead of an opaque "Internal Server Error".
export function envProblems(): string[] {
  const problems: string[] = [];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url) problems.push("NEXT_PUBLIC_SUPABASE_URL is missing");
  else {
    try {
      const u = new URL(url);
      if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("protocol");
    } catch {
      problems.push("NEXT_PUBLIC_SUPABASE_URL is not a valid URL (remove any quotes or spaces)");
    }
  }
  if (!anon) problems.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing");

  return problems;
}
