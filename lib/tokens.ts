import { createClient } from "@supabase/supabase-js";

export const TOKEN_COOKIE = "access_token";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Server-only: uses the service role key, so the Tokens table needs no public read access.
// Fails closed: any missing config or query error counts as "not active".
export async function isActiveToken(token: string | undefined): Promise<boolean> {
  if (!token || !UUID_RE.test(token)) return false;

  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });
    // Only ever looks up the one submitted token; never lists the table.
    const { data, error } = await supabase
      .from("Tokens")
      .select("token")
      .eq("token", token)
      .eq("UseState", "active")
      .limit(1);
    if (error) throw error;
    return data.length > 0;
  } catch (err) {
    console.error("Token check failed:", err);
    return false;
  }
}
