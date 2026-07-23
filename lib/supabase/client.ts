import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Singleton — multiple independent browser client instances contend for the
// same internal session lock (GoTrue's cross-tab refresh lock keys off the
// shared localStorage session), which can deadlock when several parts of the
// app (nav auth check, realtime subscription, per-request auth header) each
// spin up their own instance at once.
let client: SupabaseClient | undefined;

export function createClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
