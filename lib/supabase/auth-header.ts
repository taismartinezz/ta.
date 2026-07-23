import { createClient } from "./client";

// Client-only helper — attaches the current session's access token so API
// routes can verify "who is logged in" via getUserFromAuthHeader. Returns
// an empty object when signed out, so anonymous use is unaffected.
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
}
