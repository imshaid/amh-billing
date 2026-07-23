import { createClient } from "@supabase/supabase-js";

/**
 * Single shared Supabase client for this app — mirrors db/client.js's
 * getDB() pattern (one connection, reused everywhere) rather than creating
 * a new client per call site.
 *
 * No auth session is used anywhere in this app (single shared workspace,
 * no login) — `persistSession: false` avoids supabase-js writing an auth
 * token into localStorage that will never be read, and `autoRefreshToken:
 * false` avoids a background timer with nothing to refresh.
 */
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);
