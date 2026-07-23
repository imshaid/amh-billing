import { getAllPackages } from "../db/packages.repository.js";
import { getAllSets } from "../db/sets.repository.js";
import { getDB } from "../db/client.js";
import { STORE } from "../db/schema.js";
import { getFieldHistory } from "../db/fieldHistory.repository.js";
import {
  pushPackage,
  pushSet,
  pushPage,
  pushFieldHistory,
} from "./syncEngine.js";

/**
 * Pushes every local record to Supabase, unconditionally, once per app
 * load — fixes a real gap found during multi-device testing: Sets/Pages
 * created *before* this app had a sync layer at all (or before Supabase
 * was even set up — see this project's own history) were never pushed,
 * because the push wiring in db/*.repository.js only fires on a *new*
 * write (add/update/delete). A Set/Page nobody has touched since sync was
 * added would sit in IndexedDB forever with no push ever triggered for
 * it, so it would never appear on any other device no matter how many
 * times bootstrapSync's *pull* ran — pull only brings in what's already
 * in Supabase, it can't discover local-only data that was never sent.
 *
 * Safe to call on every app load, not just once ever: every push here is
 * `upsert(..., { onConflict: "id" })` (see syncEngine.js), so re-pushing
 * a record that's already in Supabase and unchanged is a harmless no-op
 * write, not a duplicate or an error. This is intentionally the simplest
 * correct fix rather than tracking "have I ever backfilled this device"
 * state somewhere — that bookkeeping would be its own source of bugs for
 * a one-time migration concern.
 *
 * Order matters: Sets are pushed (and awaited) before Pages, mirroring
 * db/pages.repository.js's `ensureSetPushed` — `pages.set_id` has a
 * foreign-key constraint against `sets.id` (see supabase_schema.sql), so
 * pushing a batch of Pages whose parent Sets haven't landed yet would
 * fail with the same "Key is not present in table sets" error that
 * `ensureSetPushed` exists to prevent on the single-record path.
 *
 * Never throws — a failed backfill just means this device's pre-existing
 * data stays local-only for now and gets retried on the next app load;
 * see bootstrap.js's own reasoning for why sync failures never block the
 * app or surface as errors.
 */
export async function backfillPushAll() {
  try {
    const [packages, sets] = await Promise.all([
      getAllPackages(),
      getAllSets(),
    ]);

    // Packages and Sets have no inter-dependency on each other, so these
    // can push concurrently — only Sets-before-Pages is an ordering
    // requirement (the FK constraint described above).
    await Promise.all([
      ...packages.map((pkg) =>
        pushPackage(pkg).catch((err) =>
          console.warn(
            `[amh-billing] Backfill push failed for package:${pkg.id}:`,
            err,
          ),
        ),
      ),
      ...sets.map((set) =>
        pushSet(set).catch((err) =>
          console.warn(
            `[amh-billing] Backfill push failed for set:${set.id}:`,
            err,
          ),
        ),
      ),
    ]);

    // Pages only after every Set push above has settled (Promise.all
    // already waited for all of them, success or failure) — a Set whose
    // own backfill push failed will make its Pages fail too via the same
    // foreign-key constraint, which is the correct outcome: those Pages
    // get retried on the next app load along with their Set, rather than
    // this function trying to guess which Sets succeeded.
    const db = await getDB();
    const pages = await db.getAll(STORE.PAGES);
    await Promise.all(
      pages.map((page) =>
        pushPage(page).catch((err) =>
          console.warn(
            `[amh-billing] Backfill push failed for page:${page.id}:`,
            err,
          ),
        ),
      ),
    );

    // field_history: same "just push everything, upsert is harmless"
    // approach. Reads every known field name off the store directly
    // (rather than hardcoding "buyerName"/"address") so this keeps
    // working if more autocomplete fields are added later.
    const fieldNames = (await db.getAllKeys(STORE.FIELD_HISTORY)).map(String);
    await Promise.all(
      fieldNames.map(async (fieldName) => {
        const values = await getFieldHistory(fieldName);
        return pushFieldHistory({ fieldName, values }).catch((err) =>
          console.warn(
            `[amh-billing] Backfill push failed for field_history:${fieldName}:`,
            err,
          ),
        );
      }),
    );
  } catch (err) {
    console.warn("[amh-billing] Backfill push failed:", err);
  }
}
