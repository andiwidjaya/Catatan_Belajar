import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Check if Supabase credentials are missing or placeholder
  const isPlaceholder =
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl.includes("placeholder") ||
    supabaseAnonKey.includes("placeholder");

  const pathname = request.nextUrl.pathname;

  // Define protected and auth routes
  const protectedRoutes = [
    "/dashboard",
    "/library",
    "/review",
    "/favorites",
    "/ai",
    "/settings",
  ];
  const authRoutes = ["/login", "/register"];

  const isProtectedRoute =
    pathname === "/" ||
    protectedRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );
  const isAuthRoute = authRoutes.some((route) => pathname === route);

  // Helper to copy session cookies when returning a redirect response
  const createRedirectWithCookies = (url: URL) => {
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  };

  // If Supabase is in placeholder mode (e.g. env vars not set yet in Vercel),
  // NEVER call Supabase network to prevent fatal DNS/fetch errors.
  if (isPlaceholder) {
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Check if any Supabase session cookies exist in the request
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some(
    (cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("token")
  );

  // If no auth cookies exist, the user is definitely not logged in.
  // Skip any remote network calls to Supabase completely to prevent 504 timeouts!
  let user = null;

  if (hasAuthCookie) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      });

      // Strict 2-second timeout so middleware NEVER causes 504 MIDDLEWARE_INVOCATION_TIMEOUT
      const authPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise<{ data: { user: null }; error: Error }>((_, reject) =>
        setTimeout(() => reject(new Error("Supabase auth timeout")), 2000)
      );

      const result = await Promise.race([authPromise, timeoutPromise]);
      user = result.data?.user ?? null;
    } catch (err) {
      console.warn("Middleware Supabase auth error or timeout:", err);
      user = null;
    }
  }

  // Handle root "/" path directly
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = user ? "/dashboard" : "/login";
    return createRedirectWithCookies(url);
  }

  // Unauthenticated user trying to access protected route
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return createRedirectWithCookies(url);
  }

  // Authenticated user trying to access login/register
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return createRedirectWithCookies(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
