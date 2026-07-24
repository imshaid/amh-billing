import { supabase } from "./supabaseClient.js";
import { setToRow, rowToSet } from "./rowMapping.js";
import { createSet } from "../domain/models/Set.js";
import { getPagesBySet, deletePage } from "./pages.repository.js";

/**
 * All reads/writes to Sets go through this file, straight to Supabase —
 * no IndexedDB, no debounce, no LWW merge (see this project's own
 * decision to remove the IndexedDB caching layer entirely — see
 * packages.repository.js's own doc comment for the full reasoning).
 */

/** @returns {Promise<import('../domain/models/Set.js').Set|undefined>} */
export async function getSetById(id) {
  const { data, error } = await supabase
    .from("sets")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToSet(data) : undefined;
}

/** @returns {Promise<import('../domain/models/Set.js').Set[]>} */
export async function getAllSets() {
  const { data, error } = await supabase.from("sets").select("*");
  if (error) throw error;
  return (data ?? []).map(rowToSet);
}

/**
 * @param {Partial<import('../domain/models/Set.js').Set>} input
 */
export async function addSet(input) {
  const set = createSet(input);
  const { error } = await supabase.from("sets").insert(setToRow(set));
  if (error) throw error;
  return set;
}

/**
 * @param {string} id
 * @param {Partial<import('../domain/models/Set.js').Set>} changes
 */
export async function updateSet(id, changes) {
  const existing = await getSetById(id);
  if (!existing) {
    throw new Error(`Set not found: ${id}`);
  }
  const updated = {
    ...existing,
    ...changes,
    id,
    updatedAt: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("sets")
    .update(setToRow(updated))
    .eq("id", id);
  if (error) throw error;
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
 * Deletes a Set AND every Page belonging to it — deleting the Set is
 * meaningless to the user without this: "delete this session" means the
 * whole session, not just its metadata row.
 *
 * Deletes each Page explicitly first (rather than relying solely on
 * `pages.set_id ... on delete cascade`, see supabase_schema.sql) so
 * anything watching per-Page Realtime deletes (if that's ever added)
 * sees the actual delete events, rather than rows just vanishing as a
 * side effect of the Set delete.
 *
 * @param {string} id
 */
export async function deleteSet(id) {
  const pages = await getPagesBySet(id);
  await Promise.all(pages.map((page) => deletePage(page.id)));
  const { error } = await supabase.from("sets").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Subscribes to live Set changes via Supabase Realtime — see
 * packages.repository.js's subscribeToPackages for the full reasoning
 * (row-level live sync across devices, not keystroke-level).
 *
 * @param {() => void} onChange
 * @returns {() => void} unsubscribe
 */
export function subscribeToSets(onChange) {
  const channel = supabase
    .channel("sets-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "sets" },
      onChange,
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
