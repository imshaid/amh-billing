/**
 * IndexedDB schema for AMH Billing.
 *
 * This mirrors the entities documented in /docs/data-model.md — that file is the
 * source of truth for *why* the shape looks like this (snapshot policy, rate
 * handling, summary aggregation, etc). Keep the two in sync.
 *
 * Object stores:
 *   - packages : reusable menu-item templates (Biscuit, Snacks Basic 2, ...)
 *   - sets     : a working session (1 Bill + N Invoices + 1 Summary, or any mix)
 *   - pages    : individual Bill / Invoice / Summary pages
 *
 * Versioning: bump DB_VERSION and add a new `if (oldVersion < N)` block in
 * upgrade() whenever the shape changes. Never mutate an existing version block —
 * that would break upgrades for users who already have an older version on disk.
 */

export const DB_NAME = 'amh-billing'
export const DB_VERSION = 1

export const STORE = {
  PACKAGES: 'packages',
  SETS: 'sets',
  PAGES: 'pages',
}

/**
 * Runs inside `idb`'s openDB upgrade callback.
 * @param {IDBPDatabase} db
 * @param {number} oldVersion
 */
export function upgrade(db, oldVersion) {
  if (oldVersion < 1) {
    // --- packages ---------------------------------------------------------
    const packages = db.createObjectStore(STORE.PACKAGES, { keyPath: 'id' })
    packages.createIndex('by_category', 'category')
    packages.createIndex('by_updatedAt', 'updatedAt')

    // --- sets ---------------------------------------------------------------
    const sets = db.createObjectStore(STORE.SETS, { keyPath: 'id' })
    sets.createIndex('by_updatedAt', 'updatedAt')

    // --- pages ----------------------------------------------------------
    const pages = db.createObjectStore(STORE.PAGES, { keyPath: 'id' })
    pages.createIndex('by_setId', 'setId')
    pages.createIndex('by_type', 'type')
    pages.createIndex('by_date', 'date')
    // Compound index: fetching "all invoice pages in this set, in date order"
    // is the single most common query in the app (summary aggregation, print
    // ordering), so it gets its own index rather than filtering in JS.
    pages.createIndex('by_setId_date', ['setId', 'date'])
    // Local cache purge (see docs/data-model.md — 30 day policy) needs to find
    // synced, stale rows quickly.
    pages.createIndex('by_syncedAt', 'syncedAt')
  }

  // if (oldVersion < 2) { ... } — next migration goes here, never edit above.
}
