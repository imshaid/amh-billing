import { getDB } from "../db/client.js";
import { STORE } from "../db/schema.js";
import { pullSetById, pullPagesBySet, pickNewer } from "./syncEngine.js";

/**
 * Pulls the latest Supabase copy of one Set (plus all its Pages) and
 * merges it into IndexedDB using Last-Write-Wins by `updatedAt` — see
 * syncEngine.js's own doc comment for why LWW and not a full CRDT merge.
 *
 * Called once per Set open (see hooks/usePages.js / useSets.js wiring),
 * not on a timer — this app's sync model is "push on write (debounced) +
 * pull on load" (see this project's own decision), which is what actually
 * surfaces another device's changes: without this, opening a Set on
 * Device B would just show Device B's last-known IndexedDB copy, even if
 * Device A pushed a newer edit five minutes ago.
 *
 * Silently no-ops (never throws) on network failure — a pull failing just
 * means "keep showing whatever's already in IndexedDB", which is exactly
 * this app's offline-first fallback anyway; there is no user-facing sync
 * state to report since the manual-sync button was deliberately left out
 * (see this project's own decision).
 *
 * @param {string} setId
 */
export async function pullAndMergeSet(setId) {
  try {
    const [remoteSet, remotePages] = await Promise.all([
      pullSetById(setId),
      pullPagesBySet(setId),
    ]);

    const db = await getDB();

    if (remoteSet) {
      const localSet = await db.get(STORE.SETS, setId);
      const winner = pickNewer(localSet, remoteSet);
      if (winner === remoteSet) {
        await db.put(STORE.SETS, remoteSet);
      }
    }

    // Pages: merge every remote page individually against whatever local
    // copy (if any) shares its id. A page that only exists locally (not
    // yet pushed — still inside its debounce window, or the push failed)
    // is left completely untouched here; this function only ever brings
    // *in* newer remote data, it never deletes a local row just because
    // Supabase doesn't have it yet.
    const tx = db.transaction(STORE.PAGES, "readwrite");
    await Promise.all([
      ...remotePages.map(async (remotePage) => {
        const localPage = await tx.store.get(remotePage.id);
        const winner = pickNewer(localPage, remotePage);
        if (winner === remotePage) {
          // The remote copy is authoritative here, but `syncedAt` must
          // reflect *this device's* confirmation that it's backed up —
          // carry the local value forward if the incoming remote row
          // lacks one (shouldn't normally happen, since pushPage's caller
          // always sets it after a successful push, but stays defensive).
          await tx.store.put({
            ...remotePage,
            syncedAt: remotePage.syncedAt ?? localPage?.syncedAt ?? null,
          });
        }
      }),
      tx.done,
    ]);
  } catch (err) {
    console.warn(`[amh-billing] Pull failed for set ${setId}:`, err);
  }
}
