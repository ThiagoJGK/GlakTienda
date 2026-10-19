import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js Edge Proxy for Routing Security at GLak Tienda.
 * Intercepts all administrative paths under `/admin/*` and enforces
 * strict Supabase JWT session authentication alongside administrative custom claims.
 * 
 * Complies with Next.js 16 Proxy conventions.
 * Edge-compatible (Cloudflare Workers & Wrangler runtime).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const pathname = request.nextUrl.pathname;

  // Only administrative endpoints are protected by this proxy
  if (!pathname.startsWith("/admin")) {
    return response;
  }

  // Development-only bypass: Allow local testing when dev_admin_bypass cookie is set
  if (process.env.NODE_ENV === "development" && request.cookies.get("dev_admin_bypass")?.value === "true") {
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Security Fail-Closed: If Supabase credentials are missing, never permit admin access
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Security Alert: Missing Supabase credentials in Next.js proxy for admin route:", pathname);
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("error", "config_missing");
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
      global: {
        fetch: (url, options) => {
          // Edge-resilient request abort standard (8-second timeout)
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);
          return fetch(url, { ...options, signal: controller.signal }).finally(
            () => clearTimeout(timeout)
          );
        },
      },
    }
  );

  try {
    // Authenticate user via cryptographically verified JWT
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("next", pathname);
      if (authError) {
        redirectUrl.searchParams.set("error", "session_expired");
      }
      return NextResponse.redirect(redirectUrl);
    }

    // Strict Admin Verification: Check tamper-proof app_metadata claims
    const isAdmin =
      user.app_metadata?.is_admin === true ||
      user.app_metadata?.role === "admin";

    if (!isAdmin) {
      console.warn(`Unauthorized admin route access attempt by user: ${user.email} (${user.id})`);
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(redirectUrl);
    }

    return response;
  } catch (err: any) {
    console.error("Critical authentication failure in proxy:", err);
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("error", "auth_error");
    return NextResponse.redirect(redirectUrl);
  }
}

export default proxy;

export const config = {
  matcher: ["/admin/:path*"],
};
