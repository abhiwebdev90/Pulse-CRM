import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { envProblems } from "@/lib/env";

const PUBLIC = ["/", "/login", "/signup", "/api/stripe/webhook"];

export async function proxy(request: NextRequest) {
  // Fail with a readable message (variable names only) instead of an opaque 500 when configuration is wrong.
  const problems = envProblems();
  if (problems.length) {
    console.error("[config]", problems.join("; "));
    return new NextResponse(`PulseCRM is not configured correctly:\n- ${problems.join("\n- ")}\n\nSet these in your hosting environment variables and redeploy.`, {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(list) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const signedIn = !!data?.claims;
  const path = request.nextUrl.pathname;

  if (!signedIn && !PUBLIC.includes(path) && !path.startsWith("/invite/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  // Signed-in visitors on /login and /signup are handled by the pages themselves (they show a "you're already
  // signed in" notice using a server-validated user), so there is no redirect here and no redirect loop.
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
