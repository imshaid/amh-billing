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
 * Bulk-inserts packages, but ONLY if the store is completely empty. Used by
 * the seed script on first run — safe to call repeatedly (including
 * concurrently, e.g. React StrictMode's double-invoked effects in
 * development) without duplicating data, since every call after the store
 * has anything in it at all is a no-op.
 *
 * IMPORTANT — this used to check "does a package with this name already
 * exist" per-input rather than "is the store empty at all", which was a
 * real bug: this function runs on every single app load (see App.jsx), and
 * a *rename* changes a package's name — so on the next load, the seed
 * list's original name (e.g. "Disposable Glass") no longer matched
 * anything by name (the row now says "Glass"), and got silently
 * re-inserted as a brand-new package with a new id, alongside the
 * still-present renamed one. Any edited field, not just name, could
 * trigger this depending on what the "already exists" check was
 * comparing — the actual fix is comparing against "does the store have
 * ANY packages", which a rename/edit never changes.
 *
 * The "single atomic transaction" reasoning below still applies and is
 * unchanged — only what's being checked changed.
 *
 * @param {Partial<import('../domain/models/Package.js').Package>[]} inputs
 */
export async function seedPackagesIfEmpty(inputs) {
  const db = await getDB();
  const tx = db.transaction(STORE.PACKAGES, "readwrite");

  const existingCount = await tx.store.count();
  if (existingCount > 0) {
    await tx.done;
    return;
  }

  const created = inputs.map((input) => createPackage(input));

  await Promise.all([...created.map((pkg) => tx.store.add(pkg)), tx.done]);

  // Pushed after the transaction commits (not inside it) — schedulePush's
  // debounce timers/network calls have no business being part of an
  // IndexedDB transaction's atomicity.
  created.forEach(schedulePackagePush);
}
