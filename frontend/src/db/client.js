import { openDB } from "idb";
import { DB_NAME, DB_VERSION, upgrade } from "./schema.js";

/** @type {Promise<import('idb').IDBPDatabase> | null} */
let dbPromise = null;

function openConnection() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade,
    blocked() {
      // Another tab is holding an older connection open during an upgrade.
      console.warn(
        "[amh-billing] IndexedDB upgrade blocked by another open tab. " +
          "Close other tabs of this app and reload.",
      );
    },
    async blocking() {
      // This connection is blocking a newer version (or a deleteDatabase
      // call, e.g. from DevTools) from proceeding elsewhere. We must
      // actually close() the connection — not just drop our reference to
      // it — otherwise the underlying connection is left in limbo and the
      // next transaction on it throws InvalidStateError: "The database
      // connection is closing."
      const db = await dbPromise;
      db?.close();
      dbPromise = null;
      console.warn(
        "[amh-billing] Closed this tab's IndexedDB connection because " +
          "another tab or DevTools is waiting (upgrade or delete). Reload " +
          "this tab before using the app again.",
      );
    },
    terminated() {
      // The browser force-closed the connection unexpectedly (rare, e.g.
      // the database was deleted out from under an open connection). Clear
      // the cached promise so the next getDB() call reopens cleanly instead
      // of reusing a dead connection.
      console.warn(
        "[amh-billing] IndexedDB connection terminated unexpectedly.",
      );
      dbPromise = null;
    },
  });
}

/**
 * Returns the single shared IndexedDB connection, opening it on first call.
 * All repositories (packages/sets/pages) go through this — never call
 * `openDB` anywhere else, so there is exactly one upgrade path.
 */
export function getDB() {
  if (!dbPromise) {
    dbPromise = openConnection();
  }
  return dbPromise;
}

/**
 * Dev/debug helper: closes the current connection properly and deletes the
 * whole database. Prefer this over deleting the database from DevTools'
 * Application panel — that path only signals `blocking()` and depends on
 * this tab reacting correctly, which is exactly what caused the
 * InvalidStateError seen during early development. Calling this instead
 * guarantees the connection is closed *before* deletion is requested.
 *
 * Call from the browser console: `import('/src/db/client.js').then(m => m.resetDatabaseForDev())`
 * then reload the tab.
 */
export async function resetDatabaseForDev() {
  const db = await getDB();
  db.close();
  dbPromise = null;
  await new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () =>
      console.warn(
        "[amh-billing] deleteDatabase blocked — close other tabs of this app.",
      );
  });
  console.info("[amh-billing] Database deleted. Reload the page.");
}
