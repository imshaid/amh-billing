import { createClient } from "@supabase/supabase-js";

/**
 * Single shared Supabase client for this app — Supabase is now the only
 * storage layer (see this project's own decision to remove the
 * IndexedDB caching layer entirely; the hotel has reliable wifi and
 * offline support wasn't actually needed, while the dual-storage sync
 * layer was the root cause of recurring duplicate-record bugs).
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
