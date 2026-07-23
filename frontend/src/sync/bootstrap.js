import { getDB } from "../db/client.js";
import { STORE } from "../db/schema.js";
import {
  pullAllPackages,
  pullAllSets,
  pullAllFieldHistory,
  pickNewer,
} from "./syncEngine.js";
import { purgeStalePages } from "./purge.js";

/**
 * Runs once per app load (see wiring in App.jsx) — pulls every Package,
 * every Set, and all field_history from Supabase and LWW-merges each into
 * IndexedDB, then runs the 60-day Page purge.
 *
 * Only Packages/Sets/field_history are bulk-pulled here, not Pages —
 * Pages are pulled per-Set instead (see sync/pull.js's pullAndMergeSet,
 * wired into usePages.js), since a Set's Pages are only ever needed once
 * that specific Set is opened; pulling every Page in the whole app on
 * every single load would fetch data for Sets the user isn't even
 * looking at, for no benefit — a genuinely unbounded fetch as this app's
 * history grows, unlike Packages/Sets which are deliberately kept small
 * (see this project's own decision that Packages/Sets never get purged).
 *
 * Never throws — same reasoning as pull.js's pullAndMergeSet: a failed
 * bootstrap pull just means the app proceeds with whatever's already in
 * IndexedDB, which is this app's offline-first fallback anyway.
 */
export async function bootstrapSync() {
  try {
    const [remotePackages, remoteSets, remoteFieldHistory] = await Promise.all([
      pullAllPackages(),
      pullAllSets(),
      pullAllFieldHistory(),
    ]);

    const db = await getDB();

    await mergeStore(db, STORE.PACKAGES, remotePackages);
    await mergeStore(db, STORE.SETS, remoteSets);
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
