import {
  getAllPackages,
  deletePackage,
  seedPackagesIfEmpty,
} from "../packages.repository.js";
import { defaultPackages } from "./defaultPackages.js";

/**
 * One-time migration: deletes every Package this device currently knows
 * about (locally AND on Supabase, via `deletePackage` — see
 * db/packages.repository.js, which issues both) and reseeds fresh from
 * `defaultPackages` (see this project's own decision — fixing a
 * duplicate-package bug found during testing, where the same package
 * ended up inserted more than once; confirmed present on both Desktop
 * and Phone via Supabase sync, so a local-only fix would not have been
 * enough).
 *
 * Runs automatically once per device/browser via a localStorage flag
 * (`MIGRATION_FLAG`) — not gated behind a button the person has to press,
 * per this project's own decision, since the bug affects every device
 * that ever loaded this app and a manual per-device button would leave
 * stragglers. `localStorage` (not IndexedDB) holds the flag specifically
 * so it survives even if this migration's own writes partially fail and
 * get retried — the flag only gets set after everything below has
 * actually succeeded.
 *
 * Uses `deletePackage` (not a raw store clear) deliberately: that
 * function already cancels any pending debounced push for the id being
 * removed and issues Supabase's own delete (see packages.repository.js) —
 * reusing it here means this migration doesn't need its own separate
 * "also clean up Supabase" step (like the SQL TRUNCATE this migration
 * replaces) or worry about sequencing against one. Every device that
 * runs this migration converges on the same clean, freshly-seeded set
 * independently; there's no "one device must go first" requirement.
 *
 * Safe to call on every app load — the flag check below makes every call
 * after the first a no-op.
 */
const MIGRATION_FLAG = "amh-billing:migration:package-reseed-v1";

export async function migratePackageReseed() {
  if (localStorage.getItem(MIGRATION_FLAG) === "done") return;

  try {
    const existing = await getAllPackages();
    await Promise.all(existing.map((pkg) => deletePackage(pkg.id)));
    await seedPackagesIfEmpty(defaultPackages);

    localStorage.setItem(MIGRATION_FLAG, "done");
  } catch (err) {
    // Deliberately does NOT set the flag on failure — this migration
    // should retry on the next app load rather than silently leaving a
    // device stuck with duplicate/empty packages because one attempt hit
    // a transient IndexedDB/network error.
    console.warn("[amh-billing] Package reseed migration failed:", err);
  }
}
