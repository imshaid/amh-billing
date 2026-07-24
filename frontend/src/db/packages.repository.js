import { supabase } from "./supabaseClient.js";
import { packageToRow, rowToPackage } from "./rowMapping.js";
import { createPackage } from "../domain/models/Package.js";

/**
 * All reads/writes to Packages go through this file, straight to
 * Supabase — no IndexedDB, no debounce, no LWW merge (see this project's
 * own decision to remove the IndexedDB caching layer entirely: the hotel
 * has reliable wifi, offline support wasn't actually needed, and the
 * dual-storage sync layer was the root cause of recurring
 * duplicate-record bugs — a Package edited/renamed on one device could
 * reappear under its old name because a stale local copy on another
 * device/tab got blindly re-pushed). Every function here is a direct,
 * awaited Supabase call; what you read is what's actually in the
 * database at that moment, and what you write lands there immediately.
 *
 * `packages_name_rate_key` (see supabase_add_unique_constraint.sql) is
 * the actual duplicate-prevention mechanism now — a second insert
 * sharing an existing (name, rate) pair is rejected by Postgres itself,
 * not by any client-side check.
 */

/** @returns {Promise<import('../domain/models/Package.js').Package[]>} */
export async function getAllPackages() {
  const { data, error } = await supabase.from("packages").select("*");
  if (error) throw error;
  return (data ?? []).map(rowToPackage);
}

/** @returns {Promise<import('../domain/models/Package.js').Package|undefined>} */
export async function getPackageById(id) {
  const { data, error } = await supabase
    .from("packages")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToPackage(data) : undefined;
}

/** @returns {Promise<import('../domain/models/Package.js').Package[]>} */
export async function getPackagesByCategory(category) {
  const { data, error } = await supabase
    .from("packages")
    .select("*")
    .eq("category", category);
  if (error) throw error;
  return (data ?? []).map(rowToPackage);
}

/**
 * Creates and persists a new Package.
 * @param {Partial<import('../domain/models/Package.js').Package>} input
 * @returns {Promise<import('../domain/models/Package.js').Package>}
 */
export async function addPackage(input) {
  const pkg = createPackage(input);
  const { error } = await supabase.from("packages").insert(packageToRow(pkg));
  if (error) throw error;
  return pkg;
}

/**
 * Updates an existing Package in place. This is safe to mutate directly
 * (unlike Pages) because editing a Package is only ever meant to affect
 * *future* line items — see Snapshot Policy in docs/data-model.md.
 *
 * @param {string} id
 * @param {Partial<import('../domain/models/Package.js').Package>} changes
 * @returns {Promise<import('../domain/models/Package.js').Package>}
 */
export async function updatePackage(id, changes) {
  const existing = await getPackageById(id);
  if (!existing) {
    throw new Error(`Package not found: ${id}`);
  }
  const updated = {
    ...existing,
    ...changes,
    id, // never allow id to change
    updatedAt: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("packages")
    .update(packageToRow(updated))
    .eq("id", id);
  if (error) throw error;
  return updated;
}

/** @param {string} id */
export async function deletePackage(id) {
  const { error } = await supabase.from("packages").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Seeds the default package list, but ONLY if the table is completely
 * empty — checked with a real database query (`count`), not a
 * name-matching heuristic. Safe to call on every app load: once anything
 * at all exists in the table, every subsequent call is a no-op.
 *
 * (An earlier IndexedDB-based version of this function checked "does a
 * package with this name already exist" instead of "is the table empty
 * at all" — that was a real bug: renaming a package changed its name, so
 * on the next load the seed list's original name no longer matched
 * anything, and got silently re-inserted as a brand-new duplicate
 * alongside the renamed one. Checking against "does anything exist at
 * all" avoids that class of bug entirely, since a rename/edit never
 * makes a non-empty table look empty.)
 *
 * @param {Partial<import('../domain/models/Package.js').Package>[]} inputs
 */
export async function seedPackagesIfEmpty(inputs) {
  const { count, error: countError } = await supabase
    .from("packages")
    .select("*", { count: "exact", head: true });
  if (countError) throw countError;
  if (count > 0) return;

  const created = inputs.map((input) => createPackage(input));
  const { error } = await supabase
    .from("packages")
    .insert(created.map(packageToRow));
  if (error) throw error;
}

/**
 * Subscribes to live Package changes (insert/update/delete) via Supabase
 * Realtime — see this project's own decision for "row-level live sync,
 * not keystroke-level": when any device saves a Package change, every
 * other open device's picker/editor updates automatically, without a
 * manual refresh. Returns an unsubscribe function; callers (see
 * hooks/usePackages.js) must call it on unmount to avoid leaking the
 * subscription.
 *
 * Channel name includes a random suffix — see sets.repository.js's
 * subscribeToSets for the full reasoning (fixes a real "cannot add
 * `postgres_changes` callbacks ... after `subscribe()`" crash that
 * happened whenever two subscriptions existed at once, e.g. React
 * StrictMode's double-invoked effects).
 *
 * @param {() => void} onChange Called (with no arguments — callers just
 *   re-fetch, see usePackages.js) whenever any row in `packages` changes.
 * @returns {() => void} unsubscribe
 */
export function subscribeToPackages(onChange) {
  const channel = supabase
    .channel(`packages-changes-${crypto.randomUUID()}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "packages" },
      onChange,
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
