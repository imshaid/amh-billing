import { getDB } from "../db/client.js";
import { STORE } from "../db/schema.js";
import { flushPush } from "./pushQueue.js";
import { pushSet } from "./syncEngine.js";

/**
 * Guarantees a Set row exists in Supabase *before* any of its Pages get
 * pushed there — called from db/pages.repository.js's schedulePagePush.
 *
 * Lives here (in sync/, not in db/sets.repository.js) specifically to
 * avoid a circular import: db/pages.repository.js needs to call this, but
 * db/sets.repository.js already imports from db/pages.repository.js
 * (getPagesBySet, deletePage, for deleteSet's cascade) — if this function
 * lived in sets.repository.js too, pages.repository.js importing it back
 * would create pages.repository.js <-> sets.repository.js circularity.
 * Putting it in sync/ instead means both repository files depend on
 * sync/, and sync/ depends on neither of them — a one-directional graph.
 *
 * This fixes a real bug found during testing: `pages.set_id` has a
 * foreign-key constraint against `sets.id` (see supabase_schema.sql), but
 * a brand-new Set and its very first Page(s) each schedule their own
 * independently-debounced push (see pushQueue.js) with no ordering
 * between them, so the Page's push could reach Supabase before the Set's
 * own push had landed — Postgres then rejects the Page insert outright
 * ("Key is not present in table sets").
 *
 * Two cases, both handled:
 *   1. A push for this Set is already scheduled/pending (the normal case
 *      for a just-created Set) — `flushPush` runs it immediately instead
 *      of waiting out the rest of its debounce window.
 *   2. Nothing is pending (the Set was pushed a while ago and nothing's
 *      changed since, or this is somehow being called with no prior
 *      schedule at all) — read the current local copy and push it
 *      directly, so this function's guarantee ("the Set exists in
 *      Supabase by the time this resolves") holds either way.
 *
 * @param {string} setId
 */
export async function ensureSetPushed(setId) {
  const flushed = await flushPush(`set:${setId}`);
  if (flushed) return;

  const db = await getDB();
  const set = await db.get(STORE.SETS, setId);
  if (set) {
    await pushSet(set);
  }
}
