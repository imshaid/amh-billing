/**
 * Pure functions for Bill amount/total math. No IndexedDB access here —
 * these operate on plain Page/LineItem objects so they're trivially testable
 * and reusable (e.g. from the print preview and from a future backend).
 */

/**
 * Recomputes `amount` for a single line item as quantity × rate, unless the
 * user has explicitly overridden it.
 *
 * @param {import('../models/Page.js').LineItem} lineItem
 * @returns {import('../models/Page.js').LineItem}
 */
export function recomputeLineAmount(lineItem) {
  if (lineItem.amountIsOverridden) return lineItem
  const { quantity, rate } = lineItem
  const amount = quantity != null && rate != null ? quantity * rate : null
  return { ...lineItem, amount }
}

/**
 * Recomputes every line's amount, then the page total, respecting both the
 * per-line and the page-level override flags independently.
 *
 * @param {import('../models/Page.js').Page} page
 * @returns {import('../models/Page.js').Page}
 */
export function recomputeBillTotals(page) {
  const lineItems = page.lineItems.map(recomputeLineAmount)

  if (page.totalIsOverridden) {
    return { ...page, lineItems }
  }

  const total = lineItems.reduce((sum, item) => sum + (item.amount ?? 0), 0)
  return { ...page, lineItems, total }
}

/**
 * Marks a line's amount as user-overridden and applies the given value.
 * Recomputing the page total afterwards is the caller's responsibility
 * (call `recomputeBillTotals` again) since the total's own override flag is
 * independent.
 *
 * @param {import('../models/Page.js').LineItem} lineItem
 * @param {number} amount
 */
export function overrideLineAmount(lineItem, amount) {
  return { ...lineItem, amount, amountIsOverridden: true }
}

/** Resets a line's amount override so it recomputes from quantity × rate again. */
export function resetLineAmountOverride(lineItem) {
  return recomputeLineAmount({ ...lineItem, amountIsOverridden: false })
}

/** @param {import('../models/Page.js').Page} page */
export function overrideTotal(page, total) {
  return { ...page, total, totalIsOverridden: true }
}

/** Resets the page total override so it recomputes from line amounts again. */
export function resetTotalOverride(page) {
  return recomputeBillTotals({ ...page, totalIsOverridden: false })
}
