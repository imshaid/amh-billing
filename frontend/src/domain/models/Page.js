import { snapshotPackageItems } from './Package.js'

/**
 * @typedef {Object} LineItem
 * @property {string} id
 * @property {number} sl
 * @property {string|null} packageId   Reference only — see Snapshot Policy.
 * @property {string} packageName
 * @property {{id: string, text: string}[]} items   Frozen copy, not a live ref.
 * @property {number|null} quantity
 * @property {number|null} rate
 * @property {number|null} amount
 * @property {boolean} amountIsOverridden
 * @property {boolean} quantityIsOverridden
 */

/**
 * @typedef {Object} Page
 * @property {string} id
 * @property {string} setId
 * @property {"bill"|"invoice"|"summary"} type
 * @property {string} buyerName
 * @property {string} address
 * @property {string} date        ISO date (YYYY-MM-DD)
 * @property {string} serialOrLogCode
 * @property {LineItem[]} lineItems
 * @property {number|null} total
 * @property {boolean} totalIsOverridden
 * @property {string|null} note   Internal reminder, never printed on the PDF.
 * @property {string|null} revisionOf  Metadata only, see History Edit Policy.
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string|null} syncedAt   Set once pushed to Supabase; used by the
 *                                     30-day local cache purge.
 */

/**
 * Builds a LineItem by snapshotting a Package at the moment of creation.
 * `packageId` is kept only as a convenience reference for "add another row
 * like this" — it must never be treated as a live binding to the Package.
 *
 * @param {import('./Package.js').Package} pkg
 * @param {{ sl: number, quantity?: number|null }} opts
 * @returns {LineItem}
 */
export function createLineItemFromPackage(pkg, { sl, quantity = null }) {
  return {
    id: crypto.randomUUID(),
    sl,
    packageId: pkg.id,
    packageName: pkg.name,
    items: snapshotPackageItems(pkg),
    quantity,
    rate: pkg.rate,
    amount: null,
    amountIsOverridden: false,
    quantityIsOverridden: false,
  }
}

/**
 * Creates a new Page with sane defaults.
 *
 * @param {Partial<Page> & { setId: string, type: Page['type'] }} input
 * @returns {Page}
 */
export function createPage(input) {
  const now = new Date().toISOString()
  return {
    id: input.id ?? crypto.randomUUID(),
    setId: input.setId,
    type: input.type,
    buyerName: input.buyerName ?? '',
    address: input.address ?? '',
    date: input.date ?? '',
    serialOrLogCode: input.serialOrLogCode ?? '',
    lineItems: input.lineItems ?? [],
    total: input.total ?? null,
    totalIsOverridden: input.totalIsOverridden ?? false,
    note: input.note ?? null,
    revisionOf: input.revisionOf ?? null,
    createdAt: input.createdAt ?? now,
    updatedAt: now,
    syncedAt: input.syncedAt ?? null,
  }
}

/**
 * Implements the History Edit Policy: never mutate a page that has already
 * been generated/shared. Returns a brand new Page (new id, fresh timestamps)
 * carrying the edited content, with `revisionOf` pointing at the original.
 * The original object passed in is not modified.
 *
 * @param {Page} originalPage
 * @param {Partial<Page>} changes
 * @returns {Page}
 */
export function duplicateAsRevision(originalPage, changes) {
  return createPage({
    ...originalPage,
    ...changes,
    id: crypto.randomUUID(),
    revisionOf: originalPage.id,
    createdAt: undefined, // force a fresh createdAt
    syncedAt: null, // the revision has not been synced yet
  })
}
