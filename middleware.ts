import { createMiddlewareSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  try {
    const { supabase, response } = createMiddlewareSupabaseClient(request);

    // Refresh session if expired - required for Server Components
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Protected routes that require authentication
    const protectedRoutes = ["/dashboard", "/account", "/billing"];
    const authRoutes = ["/auth/login", "/auth/register", "/auth/subscribe"];

    const isProtectedRoute = protectedRoutes.some((route) =>
      request.nextUrl.pathname.startsWith(route)
    );
    const isAuthRoute = authRoutes.some((route) =>
      request.nextUrl.pathname.startsWith(route)
    );

    // If user is not authenticated and trying to access protected route
    if (isProtectedRoute && !user) {
      const redirectUrl = new URL("/auth/login", request.url);
      redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // If user is authenticated and trying to access auth routes
    if (isAuthRoute && user) {
      // Check if user has completed subscription setup
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier, subscription_status")
        .eq("id", user.id)
        .single();

      // If user doesn't have a subscription and is not on the subscribe page
      if (
        !profile?.subscription_tier &&
        request.nextUrl.pathname !== "/auth/subscribe"
      ) {
        return NextResponse.redirect(new URL("/auth/subscribe", request.url));
      }

      // If user has subscription, redirect to dashboard
      if (profile?.subscription_tier) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    // Special handling for subscription page
    if (request.nextUrl.pathname === "/auth/subscribe") {
      if (!user) {
        return NextResponse.redirect(new URL("/auth/login", request.url));
      }

      // Check if user already has a subscription
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier")
        .eq("id", user.id)
        .single();

      if (profile?.subscription_tier) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    return response;
  } catch (e) {
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes that don't require auth
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api/auth|api/subscription/webhook).*)",
  ],
};
