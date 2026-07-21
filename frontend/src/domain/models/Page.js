import { snapshotPackageItems } from "./Package.js";

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
  };
}

/**
 * Creates a new Page with sane defaults.
 *
 * @param {Partial<Page> & { setId: string, type: Page['type'] }} input
 * @returns {Page}
 */
export function createPage(input) {
  const now = new Date().toISOString();
  return {
    id: input.id ?? crypto.randomUUID(),
    setId: input.setId,
    type: input.type,
    buyerName: input.buyerName ?? "",
    address: input.address ?? "",
    date: input.date ?? "",
    serialOrLogCode: input.serialOrLogCode ?? "",
    lineItems: input.lineItems ?? [],
    total: input.total ?? null,
    totalIsOverridden: input.totalIsOverridden ?? false,
    note: input.note ?? null,
    revisionOf: input.revisionOf ?? null,
    createdAt: input.createdAt ?? now,
    updatedAt: now,
    syncedAt: input.syncedAt ?? null,
  };
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
  });
}

/**
 * Builds a brand new Page pre-filled from `sourcePage` — buyerName, address,
 * date, serialOrLogCode, and lineItems all copied over — used by the
 * workspace's per-page "+ নতুন বিল/চালান" buttons (see WorkspaceView/
 * CanvasArea), which always duplicate whichever page they were clicked
 * under rather than starting blank.
 *
 * NOT used for creating a Summary page — see `createSummaryPage` instead.
 * Summary is a fundamentally different case: its buyerName is the only
 * field that carries over, and its lineItems are never a copy of anything —
 * they're always *derived* at render time from the Set's Invoice pages (see
 * recomputeSummaryLines / useRenderedPages), so pre-filling them here would
 * just be overwritten anyway, and it's clearer to not pretend Summary has a
 * "source page" it was duplicated from at all.
 *
 * `type` can differ from `sourcePage.type` (e.g. adding an Invoice under a
 * Bill). When it does, each copied line item keeps its packageName/items/
 * rate but drops `quantity` (reset to null, override flags cleared) — a
 * Bill's quantities describe what was billed overall, which has no
 * guaranteed relationship to what any one Invoice actually delivered, so
 * carrying the number over silently would be misleading. When the type
 * matches (Bill→Bill, Invoice→Invoice), quantity carries over unchanged,
 * since consecutive pages of the same type commonly do repeat the same
 * count (see the project's own multi-day invoice batches in main.tex).
 *
 * Unlike `duplicateAsRevision`, this is NOT a revision of `sourcePage` — it's
 * an independent new page (no `revisionOf` link, not the History Edit
 * Policy) that merely starts pre-populated; the user is free to change or
 * delete every copied line, and `sourcePage` itself is completely untouched.
 * Line items get fresh ids so editing quantity/rate on the new page's copy
 * never mutates the source page's own lineItems array.
 *
 * @param {Page} sourcePage
 * @param {{ setId: string, type: Page['type'] }} target
 * @returns {Page}
 */
export function duplicatePageAsNew(sourcePage, { setId, type }) {
  const isSameType = type === sourcePage.type;
  return createPage({
    setId,
    type,
    buyerName: sourcePage.buyerName,
    address: sourcePage.address,
    date: sourcePage.date,
    serialOrLogCode: sourcePage.serialOrLogCode,
    lineItems: sourcePage.lineItems.map((line) => ({
      ...line,
      id: crypto.randomUUID(),
      items: line.items.map((item) => ({ ...item })),
      quantity: isSameType ? line.quantity : null,
      quantityIsOverridden: isSameType ? line.quantityIsOverridden : false,
      amount: isSameType ? line.amount : null,
      amountIsOverridden: isSameType ? line.amountIsOverridden : false,
    })),
  });
}

/**
 * Builds a brand new Summary page. Per the Summary Page section in
 * docs/data-model.md — "buyerName/address/date/serialOrLogCode default
 * empty (user can fill them in), quantity is auto-aggregated" — only
 * `buyerName` carries over from whichever page the "+ নতুন সামারি" button
 * was clicked under; address/date/serialOrLogCode always start blank
 * (still editable afterward, same as any other field).
 *
 * `lineItems` starts empty here on purpose: it is never read back from
 * storage for display — `recomputeSummaryLines` (via useRenderedPages)
 * rebuilds it on every render from the Set's Invoice pages, falling back to
 * the Bill's packages when there are no Invoice pages yet (see
 * summaryCalculator.js's fallback logic) — so whatever is stored here is
 * only a snapshot of the last manual override, not the source of truth for
 * what packages appear.
 *
 * @param {{ setId: string, buyerName?: string }} input
 * @returns {Page}
 */
export function createSummaryPage({ setId, buyerName = "" }) {
  return createPage({
    setId,
    type: "summary",
    buyerName,
    address: "",
    date: "",
    serialOrLogCode: "",
    lineItems: [],
  });
}
