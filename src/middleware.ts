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
  // NEVER call supabase.auth.getUser() to prevent fatal DNS/fetch errors.
  if (isPlaceholder) {
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Create Supabase client and retrieve user safely
  let user = null;
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

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  } catch (err) {
    console.error("Middleware Supabase auth error:", err);
    user = null;
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
