import { getDB } from "./client.js";
import { STORE } from "./schema.js";
import { createPackage } from "../domain/models/Package.js";
import { schedulePush, cancelPush } from "../sync/pushQueue.js";
import { pushPackage, deletePackageRemote } from "../sync/syncEngine.js";

/**
 * Schedules a debounced Supabase push for a Package. Like Set (see
 * sets.repository.js), Package has no `syncedAt` field — Packages are
 * never purged from IndexedDB (see this project's own decision), so
 * there's nothing that needs to read one.
 *
 * @param {import('../domain/models/Package.js').Package} pkg
 */
function schedulePackagePush(pkg) {
  schedulePush(`package:${pkg.id}`, () => pushPackage(pkg));
}

/**
 * All reads/writes to the `packages` store go through this file. Nothing else
 * in the app should call `db.transaction(STORE.PACKAGES, ...)` directly —
 * that keeps the IndexedDB query shape in one place if the schema changes.
 */

/** @returns {Promise<import('../domain/models/Package.js').Package[]>} */
export async function getAllPackages() {
  const db = await getDB();
  return db.getAll(STORE.PACKAGES);
}

/** @returns {Promise<import('../domain/models/Package.js').Package|undefined>} */
export async function getPackageById(id) {
  const db = await getDB();
  return db.get(STORE.PACKAGES, id);
}

/** @returns {Promise<import('../domain/models/Package.js').Package[]>} */
export async function getPackagesByCategory(category) {
  const db = await getDB();
  return db.getAllFromIndex(STORE.PACKAGES, "by_category", category);
}

/**
 * Creates and persists a new Package.
 * @param {Partial<import('../domain/models/Package.js').Package>} input
 * @returns {Promise<import('../domain/models/Package.js').Package>}
 */
export async function addPackage(input) {
  const db = await getDB();
  const pkg = createPackage(input);
  await db.add(STORE.PACKAGES, pkg);
  schedulePackagePush(pkg);
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
  const db = await getDB();
  const existing = await db.get(STORE.PACKAGES, id);
  if (!existing) {
    throw new Error(`Package not found: ${id}`);
  }
  const updated = {
    ...existing,
    ...changes,
    id, // never allow id to change
    updatedAt: new Date().toISOString(),
  };
  await db.put(STORE.PACKAGES, updated);
  schedulePackagePush(updated);
  return updated;
}

/** @param {string} id */
export async function deletePackage(id) {
  cancelPush(`package:${id}`);
  const db = await getDB();
  await db.delete(STORE.PACKAGES, id);
  deletePackageRemote(id).catch((err) =>
    console.warn(
      `[amh-billing] Supabase delete failed for package:${id}:`,
      err,
    ),
  );
}

/**
 * Bulk-inserts packages, skipping any that already exist by name. Used by the
 * seed script on first run — safe to call repeatedly (including concurrently,
 * e.g. React StrictMode's double-invoked effects in development) without
 * duplicating data.
 *
 * IMPORTANT: the "read existing names" and "write missing ones" steps run
 * inside a *single* IndexedDB transaction. An earlier version read via
 * `db.getAll()` (its own auto-committing transaction) and then opened a
 * separate `readwrite` transaction to insert — that left a gap where two
 * overlapping calls (e.g. React StrictMode invoking the effect twice) could
 * both read "store is empty" before either had written anything, causing
 * every package to be inserted twice. Doing both steps on `tx.store` inside
 * one transaction closes that gap: IndexedDB transactions are atomic, so a
 * second overlapping call is queued behind the first one entirely, not
 * interleaved with it.
 *
 * @param {Partial<import('../domain/models/Package.js').Package>[]} inputs
 */
export async function seedPackagesIfEmpty(inputs) {
  const db = await getDB();
  const tx = db.transaction(STORE.PACKAGES, "readwrite");

  const existing = await tx.store.getAll();
  const existingNames = new Set(existing.map((pkg) => pkg.name));
  const toInsert = inputs.filter((input) => !existingNames.has(input.name));
  const created = toInsert.map((input) => createPackage(input));

  await Promise.all([...created.map((pkg) => tx.store.add(pkg)), tx.done]);

  // Pushed after the transaction commits (not inside it) — schedulePush's
  // debounce timers/network calls have no business being part of an
  // IndexedDB transaction's atomicity.
  created.forEach(schedulePackagePush);
}
