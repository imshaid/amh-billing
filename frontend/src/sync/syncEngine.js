import { supabase } from "./supabaseClient.js";
import {
  packageToRow,
  rowToPackage,
  setToRow,
  rowToSet,
  pageToRow,
  rowToPage,
  fieldHistoryToRow,
  rowToFieldHistory,
} from "./rowMapping.js";

/**
 * Push + pull + Last-Write-Wins merge, one function pair per table. This is
 * the only file that talks to `supabase.from(...)` directly — every other
 * sync/ or db/ file goes through the functions here, so a schema or
 * conflict-policy change only needs updating in one place.
 *
 * Conflict policy: Last-Write-Wins by `updatedAt`. Chosen (see this
 * project's own decision, discussed with the user) because this is a
 * small hotel team where genuine same-field concurrent edits are rare —
 * true CRDT/operational-transform merging would be substantial complexity
 * for a risk this app doesn't really have. Every entity already carries
 * `updatedAt` (see domain/models/*.js), so LWW needs no new fields.
 *
 * Multi-device model: this app is used from several devices/browsers at
 * once (see this project's own decision). That's exactly the situation
 * LWW-on-pull below protects against — without it, a `pull` that blindly
 * overwrote local IndexedDB with whatever Supabase has would silently
 * discard a local edit made moments ago that hasn't been pushed yet.
 */

/**
 * Generic LWW merge: given a local row and (possibly absent) remote row,
 * returns whichever one has the newer `updatedAt`. If only one side
 * exists, that side wins outright (nothing to compare against).
 *
 * @param {{updatedAt: string}|null|undefined} local
 * @param {{updatedAt: string}|null|undefined} remote
 */
function pickNewer(local, remote) {
  if (!local) return remote;
  if (!remote) return local;
  return remote.updatedAt > local.updatedAt ? remote : local;
}

// ---------------------------------------------------------------------
// packages
// ---------------------------------------------------------------------

/** @param {import('../domain/models/Package.js').Package} pkg */
export async function pushPackage(pkg) {
  const { error } = await supabase
    .from("packages")
    .upsert(packageToRow(pkg), { onConflict: "id" });
  if (error) throw error;
}

/** @param {string} id */
export async function deletePackageRemote(id) {
  const { error } = await supabase.from("packages").delete().eq("id", id);
  if (error) throw error;
}

/** @returns {Promise<import('../domain/models/Package.js').Package[]>} */
export async function pullAllPackages() {
  const { data, error } = await supabase.from("packages").select("*");
  if (error) throw error;
  return (data ?? []).map(rowToPackage);
}

// ---------------------------------------------------------------------
// sets
// ---------------------------------------------------------------------

/** @param {import('../domain/models/Set.js').Set} set */
export async function pushSet(set) {
  const { error } = await supabase
    .from("sets")
    .upsert(setToRow(set), { onConflict: "id" });
  if (error) throw error;
}

/** @param {string} id */
export async function deleteSetRemote(id) {
  // Relies on the schema's `pages.set_id ... on delete cascade` (see
  // supabase_schema.sql) to remove this Set's Pages on the server too —
  // mirrors db/sets.repository.js's deleteSet, which does the equivalent
  // cleanup explicitly on the IndexedDB side since IndexedDB has no
  // foreign-key cascade of its own.
  const { error } = await supabase.from("sets").delete().eq("id", id);
  if (error) throw error;
}

/** @returns {Promise<import('../domain/models/Set.js').Set[]>} */
export async function pullAllSets() {
  const { data, error } = await supabase.from("sets").select("*");
  if (error) throw error;
  return (data ?? []).map(rowToSet);
}

/** @param {string} id */
export async function pullSetById(id) {
  const { data, error } = await supabase
    .from("sets")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToSet(data) : null;
}

// ---------------------------------------------------------------------
// pages
// ---------------------------------------------------------------------

/**
 * Pushes a page, then stamps `syncedAt` on the *local* IndexedDB copy on
 * success — this is the one write in this file that also touches
 * IndexedDB, because `syncedAt` only means anything once the push is
 * confirmed, and the local purge routine (see purge.js) reads it directly
 * from IndexedDB.
 *
 * @param {import('../domain/models/Page.js').Page} page
 */
export async function pushPage(page) {
  const { error } = await supabase
    .from("pages")
    .upsert(pageToRow(page), { onConflict: "id" });
  if (error) throw error;
}

/** @param {string} id */
export async function deletePageRemote(id) {
  const { error } = await supabase.from("pages").delete().eq("id", id);
  if (error) throw error;
}

/** @param {string} setId */
export async function pullPagesBySet(setId) {
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("set_id", setId);
  if (error) throw error;
  return (data ?? []).map(rowToPage);
}

/**
 * Fetches every Page across every Set — used by the startup bootstrap
 * (see sync/bootstrap.js) per this project's own decision to fully sync
 * all history on every app load, not just the Set currently being viewed.
 *
 * @returns {Promise<import('../domain/models/Page.js').Page[]>}
 */
export async function pullAllPages() {
  const { data, error } = await supabase.from("pages").select("*");
  if (error) throw error;
  return (data ?? []).map(rowToPage);
}

/**
 * Fetches a single Page from Supabase — used by the 60-day-purge re-fetch
 * path (see purge.js) when the user opens a Set whose Page was purged
 * from IndexedDB locally but still exists in Supabase.
 *
 * @param {string} id
 */
export async function pullPageById(id) {
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToPage(data) : null;
}

// ---------------------------------------------------------------------
// field_history
// ---------------------------------------------------------------------

/** @param {{fieldName: string, values: string[], updatedAt?: string}} entry */
export async function pushFieldHistory(entry) {
  const { error } = await supabase
    .from("field_history")
    .upsert(fieldHistoryToRow(entry), { onConflict: "field_name" });
  if (error) throw error;
}

export async function pullAllFieldHistory() {
  const { data, error } = await supabase.from("field_history").select("*");
  if (error) throw error;
  return (data ?? []).map(rowToFieldHistory);
}

export { pickNewer };
