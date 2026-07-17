/**
 * Builds/recomputes a Summary page's line items from the Invoice pages in
 * the same Set. See "Summary Page" in docs/data-model.md:
 *   - quantity per package = sum across all Invoice pages in the Set
 *   - a manually-edited quantity stops recomputing until reset
 */

/**
 * @param {import('../models/Page.js').Page[]} invoicePages
 * @returns {Map<string, { packageId: string|null, packageName: string, items: {id:string,text:string}[], quantity: number }>}
 *          keyed by packageId (falls back to packageName if packageId is null,
 *          so hand-typed rows without a linked Package still aggregate correctly)
 */
function sumQuantitiesByPackage(invoicePages) {
  const totals = new Map()

  for (const page of invoicePages) {
    for (const line of page.lineItems) {
      const key = line.packageId ?? `name:${line.packageName}`
      const existing = totals.get(key)
      const qty = line.quantity ?? 0

      if (existing) {
        existing.quantity += qty
      } else {
        totals.set(key, {
          packageId: line.packageId,
          packageName: line.packageName,
          items: line.items,
          quantity: qty,
        })
      }
    }
  }

  return totals
}

/**
 * Recomputes a Summary page's line items against the current Invoice pages
 * in its Set. Lines with `quantityIsOverridden: true` keep their manually
 * set quantity; everything else is replaced with the fresh sum.
 *
 * New packages that appear in the invoices but have no existing Summary line
 * yet are appended as new lines (not overridden).
 *
 * @param {import('../models/Page.js').Page} summaryPage
 * @param {import('../models/Page.js').Page[]} invoicePages
 * @returns {import('../models/Page.js').Page}
 */
export function recomputeSummaryLines(summaryPage, invoicePages) {
  const totals = sumQuantitiesByPackage(invoicePages)
  const existingByKey = new Map(
    summaryPage.lineItems.map((line) => [line.packageId ?? `name:${line.packageName}`, line])
  )

  const nextLineItems = []
  let sl = 1

  for (const [key, totalEntry] of totals) {
    const existingLine = existingByKey.get(key)

    if (existingLine?.quantityIsOverridden) {
      nextLineItems.push({ ...existingLine, sl: sl++ })
      continue
    }

    nextLineItems.push({
      id: existingLine?.id ?? crypto.randomUUID(),
      sl: sl++,
      packageId: totalEntry.packageId,
      packageName: totalEntry.packageName,
      items: totalEntry.items,
      quantity: totalEntry.quantity,
      rate: existingLine?.rate ?? null,
      amount: null,
      amountIsOverridden: existingLine?.amountIsOverridden ?? false,
      quantityIsOverridden: false,
    })
  }

  return { ...summaryPage, lineItems: nextLineItems }
}

/**
 * Marks a specific Summary line's quantity as user-overridden.
 * @param {import('../models/Page.js').Page} summaryPage
 * @param {string} lineItemId
 * @param {number} quantity
 */
export function overrideSummaryLineQuantity(summaryPage, lineItemId, quantity) {
  return {
    ...summaryPage,
    lineItems: summaryPage.lineItems.map((line) =>
      line.id === lineItemId ? { ...line, quantity, quantityIsOverridden: true } : line
    ),
  }
}

/**
 * Resets a Summary line's override so it goes back to auto-summing on the
 * next `recomputeSummaryLines` call.
 * @param {import('../models/Page.js').Page} summaryPage
 * @param {string} lineItemId
 */
export function resetSummaryLineOverride(summaryPage, lineItemId) {
  return {
    ...summaryPage,
    lineItems: summaryPage.lineItems.map((line) =>
      line.id === lineItemId ? { ...line, quantityIsOverridden: false } : line
    ),
  }
}
