import { getDB } from "../db/client.js";
import { STORE } from "../db/schema.js";
import {
  pullAllPackages,
  pullAllSets,
  pullAllPages,
  pullAllFieldHistory,
  pickNewer,
} from "./syncEngine.js";
import { purgeStalePages } from "./purge.js";

/**
 * Runs once per app load (see wiring in App.jsx) — pulls every Package,
 * every Set, every Page, and all field_history from Supabase and
 * LWW-merges each into IndexedDB, then runs the 60-day Page purge.
 *
 * Pages ARE bulk-pulled here (all of them, across every Set) — see this
 * project's own decision: opening the app on any device should
 * immediately show every session's full history already synced, without
 * requiring the user to open each Set first to trigger its own pull (see
 * sync/pull.js's pullAndMergeSet, which still separately runs per-Set on
 * open as a fast, cheap top-up — see that file's own doc comment — but is
 * no longer the *only* path Pages get pulled through). This does mean
 * startup fetches this app's entire Page history on every load, which
 * will only ever grow — accepted trade-off per the user's explicit
 * preference for full-history sync over a recency-windowed one.
 *
 * Never throws — same reasoning as pull.js's pullAndMergeSet: a failed
 * bootstrap pull just means the app proceeds with whatever's already in
 * IndexedDB, which is this app's offline-first fallback anyway.
 */
export async function bootstrapSync() {
  try {
    const [remotePackages, remoteSets, remotePages, remoteFieldHistory] =
      await Promise.all([
        pullAllPackages(),
        pullAllSets(),
        pullAllPages(),
        pullAllFieldHistory(),
      ]);

    const db = await getDB();

    await mergeStore(db, STORE.PACKAGES, remotePackages);
    await mergeStore(db, STORE.SETS, remoteSets);
    await mergePages(db, remotePages);
    await mergeStore(db, STORE.FIELD_HISTORY, remoteFieldHistory, "fieldName");
  } catch (err) {
    console.warn("[amh-billing] Bootstrap sync pull failed:", err);
  }

  // Independent of whether the pull above succeeded — purging is a purely
  // local operation (reads IndexedDB's own syncedAt/updatedAt) and doesn't
  // need fresh remote data to decide what's safe to drop.
  try {
    await purgeStalePages();
  } catch (err) {
    console.warn("[amh-billing] Startup purge failed:", err);
  }
}

/**
 * LWW-merges a list of remote rows into an IndexedDB store keyed by
 * `keyPath` (defaults to "id", matching packages/sets; field_history uses
 * "fieldName" instead — see db/schema.js).
 *
 * @param {import('idb').IDBPDatabase} db
 * @param {string} storeName
 * @param {{updatedAt: string}[]} remoteRows
 * @param {string} keyPath
 */
async function mergeStore(db, storeName, remoteRows, keyPath = "id") {
  const tx = db.transaction(storeName, "readwrite");
  await Promise.all([
    ...remoteRows.map(async (remoteRow) => {
      const localRow = await tx.store.get(remoteRow[keyPath]);
      const winner = pickNewer(localRow, remoteRow);
      if (winner === remoteRow) {
        await tx.store.put(remoteRow);
      }
    }),
    tx.done,
  ]);
}

/**
 * Same LWW merge as `mergeStore`, but specific to Pages — Pages carry a
 * `syncedAt` (used by the 60-day purge, see purge.js) that `mergeStore`'s
 * generic version doesn't know to preserve. Mirrors the exact same
 * `syncedAt`-carrying logic as sync/pull.js's pullAndMergeSet, since a
 * Page arriving here via the startup bulk pull should behave identically
 * to one arriving via that per-Set pull — same merge, same source of
 * truth, just a different entry point.
 *
 * @param {import('idb').IDBPDatabase} db
 * @param {import('../domain/models/Page.js').Page[]} remotePages
 */
async function mergePages(db, remotePages) {
  const tx = db.transaction(STORE.PAGES, "readwrite");
  await Promise.all([
    ...remotePages.map(async (remotePage) => {
      const localPage = await tx.store.get(remotePage.id);
      const winner = pickNewer(localPage, remotePage);
      if (winner === remotePage) {
        await tx.store.put({
          ...remotePage,
          syncedAt: remotePage.syncedAt ?? localPage?.syncedAt ?? null,
        });
      }
    }),
    tx.done,
  ]);
}
