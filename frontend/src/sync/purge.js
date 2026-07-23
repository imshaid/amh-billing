import { getPurgeableSyncedPages } from "../db/pages.repository.js";
import { getDB } from "../db/client.js";
import { STORE } from "../db/schema.js";

/**
 * Local Cache Policy purge window — see docs/data-model.md. NOTE: this is
 * 60 days, not the 30 originally drafted in data-model.md; that doc has a
 * pending update to match (see this project's own decision to widen the
 * window). Kept here as the single source of truth for the number so
 * nothing else hardcodes it.
 */
export const PURGE_MAX_AGE_DAYS = 60;

/**
 * Deletes every Page from IndexedDB that has already been confirmed synced
 * to Supabase (`syncedAt` set) and is older than PURGE_MAX_AGE_DAYS. The
 * Supabase copy is untouched — this only trims what's kept on-device (see
 * "Local Cache Policy" in docs/data-model.md and getPurgeableSyncedPages's
 * own doc comment).
 *
 * Deliberately does NOT touch `packages` or `sets` — see this project's
 * own decision: those stay in IndexedDB permanently (small reference/
 * session-metadata tables that the app needs available even for an old,
 * otherwise-purged session's Previous Sessions card, and package picker
 * needs every Package regardless of age). Only `pages` — the actually
 * large, ever-growing table — is purged.
 *
 * Safe to call repeatedly/on a schedule (see wiring in App.jsx) — a
 * Page that's already gone just isn't found by getPurgeableSyncedPages
 * again next time.
 */
export async function purgeStalePages() {
  const purgeable = await getPurgeableSyncedPages(PURGE_MAX_AGE_DAYS);
  if (purgeable.length === 0) return;

  const db = await getDB();
  const tx = db.transaction(STORE.PAGES, "readwrite");
  await Promise.all([
    ...purgeable.map((page) => tx.store.delete(page.id)),
    tx.done,
  ]);

  console.info(
    `[amh-billing] Purged ${purgeable.length} synced page(s) older than ${PURGE_MAX_AGE_DAYS} days from local cache.`,
  );
}
