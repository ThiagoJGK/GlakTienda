import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Creates a Supabase server client for use in Server Components and Route Handlers.
 * Uses cookie-based auth for SSR.
 * 
 * NOTE: If you see "TypeError: fetch failed" or "getaddrinfo ENOTFOUND", 
 * your Supabase project may be paused (free tier pauses after 7 days of inactivity).
 * Go to https://supabase.com/dashboard → select your project → click "Restore project".
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore.
          }
        },
      },
      global: {
        fetch: (url, options) => {
          // Abort slow/unreachable requests after 8 seconds
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);
          return fetch(url, { ...options, signal: controller.signal }).finally(
            () => clearTimeout(timeout)
          );
        },
      },
    }
  );
}
