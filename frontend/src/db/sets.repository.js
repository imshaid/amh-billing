import { getDB } from "./client.js";
import { STORE } from "./schema.js";
import { createSet } from "../domain/models/Set.js";
import { getPagesBySet, deletePage } from "./pages.repository.js";

/** @returns {Promise<import('../domain/models/Set.js').Set|undefined>} */
export async function getSetById(id) {
  const db = await getDB();
  return db.get(STORE.SETS, id);
}

/** @returns {Promise<import('../domain/models/Set.js').Set[]>} */
export async function getAllSets() {
  const db = await getDB();
  return db.getAll(STORE.SETS);
}

/**
 * @param {Partial<import('../domain/models/Set.js').Set>} input
 */
export async function addSet(input) {
  const db = await getDB();
  const set = createSet(input);
  await db.add(STORE.SETS, set);
  return set;
}

/**
 * @param {string} id
 * @param {Partial<import('../domain/models/Set.js').Set>} changes
 */
export async function updateSet(id, changes) {
  const db = await getDB();
  const existing = await db.get(STORE.SETS, id);
  if (!existing) {
    throw new Error(`Set not found: ${id}`);
  }
  const updated = {
    ...existing,
    ...changes,
    id,
    updatedAt: new Date().toISOString(),
  };
  await db.put(STORE.SETS, updated);
  return updated;
}

/**
 * Re-derives `pageIds` from the actual Page rows (ordered by date — see
 * `getPagesBySet`) and persists it back onto the Set. Call this after adding
 * a page or changing a page's date, so `Set.pageIds` never drifts out of
 * sync with reality.
 *
 * @param {string} setId
 */
export async function resyncSetPageOrder(setId) {
  const pages = await getPagesBySet(setId);
  return updateSet(setId, { pageIds: pages.map((p) => p.id) });
}

/**
 * Deletes a Set AND every Page belonging to it — this used to only delete
 * the Set row itself, silently leaving every one of its Bill/Invoice/
 * Summary pages behind as orphans in the `pages` store (unreachable from
 * any Set, but still taking up space and still matched by any future
 * cross-Set query). Deleting the Set is meaningless to the user without
 * this — "delete this session" means the whole session, not just its
 * metadata row.
 *
 * @param {string} id
 */
export async function deleteSet(id) {
  const pages = await getPagesBySet(id);
  await Promise.all(pages.map((page) => deletePage(page.id)));
  const db = await getDB();
  await db.delete(STORE.SETS, id);
}
