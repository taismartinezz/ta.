import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Server-only client: uses the secret key to bypass RLS. Safe here because
// there's no Supabase Auth session to manage — trip access is via the
// shareable link, enforced entirely by the API routes, never the browser.
export async function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}
