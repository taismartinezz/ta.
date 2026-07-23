import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Verifies a client-supplied session token against Supabase Auth itself —
// never trust a client-supplied user id directly.
export async function getUserFromAuthHeader(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice("Bearer ".length);
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return null;
  }

  return data.user;
}
