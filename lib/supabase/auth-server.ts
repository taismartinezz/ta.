import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Session-aware client (anon key + cookies) — used only to read "who is
// logged in" server-side. Trusted data access still goes through
// lib/supabase/server.ts's secret-key client, unchanged.
export async function createAuthServerClient() {
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
            // Called from a Server Component render — middleware refreshes instead.
          }
        },
      },
    }
  );
}
