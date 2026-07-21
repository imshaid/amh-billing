/**
 * Builds/recomputes a Summary page's line items from the Invoice pages in
 * the same Set. See "Summary Page" in docs/data-model.md:
 *   - quantity per package = sum across all Invoice pages in the Set
 *   - a manually-edited quantity stops recomputing until reset
 *
 * Falls back to the Set's Bill pages for which *packages* to list (not
 * quantities) when there are no Invoice pages yet — see
 * `packagesFromBillPages`. Without this, adding a Summary page to a Set
 * that only has a Bill (no Invoice created yet) would show a completely
 * empty table even though the Bill's packages are sitting right there,
 * which reads as broken rather than "correctly waiting for invoices."
 */

/**
 * @param {import('../models/Page.js').Page[]} invoicePages
 * @returns {Map<string, { packageId: string|null, packageName: string, items: {id:string,text:string}[], quantity: number }>}
 *          keyed by packageId (falls back to packageName if packageId is null,
 *          so hand-typed rows without a linked Package still aggregate correctly)
 */
function sumQuantitiesByPackage(invoicePages) {
  const totals = new Map();

  for (const page of invoicePages) {
    for (const line of page.lineItems) {
      const key = line.packageId ?? `name:${line.packageName}`;
      const existing = totals.get(key);
      const qty = line.quantity ?? 0;

      if (existing) {
        existing.quantity += qty;
      } else {
        totals.set(key, {
          packageId: line.packageId,
          packageName: line.packageName,
          items: line.items,
          quantity: qty,
        });
      }
    }
  }

  return totals;
}

/**
 * Fallback used only when there are zero Invoice pages in the Set: lists
 * every distinct package that appears across the Set's Bill pages, with
 * quantity fixed at 0 (there is no invoice data yet to sum — this is a
 * "here's what's expected to show up" placeholder, not a real total, and
 * is never treated as overridden so it starts auto-summing for real the
 * moment an actual Invoice page/line exists).
 *
 * @param {import('../models/Page.js').Page[]} billPages
 * @returns {Map<string, { packageId: string|null, packageName: string, items: {id:string,text:string}[], quantity: number }>}
 */
function packagesFromBillPages(billPages) {
  const totals = new Map();

  for (const page of billPages) {
    for (const line of page.lineItems) {
      const key = line.packageId ?? `name:${line.packageName}`;
      if (totals.has(key)) continue;
      totals.set(key, {
        packageId: line.packageId,
        packageName: line.packageName,
        items: line.items,
        quantity: 0,
      });
    }
  }

  return totals;
}

/**
 * Recomputes a Summary page's line items against the current Invoice pages
 * in its Set (or, if there are none yet, against the Set's Bill pages —
 * see `packagesFromBillPages`). Lines with `quantityIsOverridden: true`
 * keep their manually set quantity; everything else is replaced with the
 * fresh sum.
 *
 * New packages that appear in the invoices but have no existing Summary line
 * yet are appended as new lines (not overridden).
 *
 * @param {import('../models/Page.js').Page} summaryPage
 * @param {import('../models/Page.js').Page[]} invoicePages
 * @param {import('../models/Page.js').Page[]} [billPages]  Only consulted when invoicePages is empty.
 * @returns {import('../models/Page.js').Page}
 */
export function recomputeSummaryLines(
  summaryPage,
  invoicePages,
  billPages = [],
) {
  const totals =
    invoicePages.length > 0
      ? sumQuantitiesByPackage(invoicePages)
      : packagesFromBillPages(billPages);
  const existingByKey = new Map(
    summaryPage.lineItems.map((line) => [
      line.packageId ?? `name:${line.packageName}`,
      line,
    ]),
  );

  const nextLineItems = [];
  let sl = 1;

  for (const [key, totalEntry] of totals) {
    const existingLine = existingByKey.get(key);

    if (existingLine?.quantityIsOverridden) {
      nextLineItems.push({ ...existingLine, sl: sl++ });
      continue;
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
    });
  }

  return { ...summaryPage, lineItems: nextLineItems };
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
      line.id === lineItemId
        ? { ...line, quantity, quantityIsOverridden: true }
        : line,
    ),
  };
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
      line.id === lineItemId ? { ...line, quantityIsOverridden: false } : line,
    ),
  };
}
