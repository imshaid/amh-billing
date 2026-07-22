/**
 * Package-list sync and quantity aggregation for Invoice/Summary pages.
 *
 * Per the corrected mental model (see docs/data-model.md's now-superseded
 * "Summary Page" section — this file is the actual current behavior):
 * Bill is the one page type where packages are directly added/edited/
 * deleted by the user. Invoice and Summary are otherwise completely normal,
 * independently-editable pages (their own lineItems persist in IndexedDB
 * like any other page — nothing here wholesale-replaces lineItems on every
 * render the way the old recomputeSummaryLines did), EXCEPT:
 *   - Their *package list* (which packages appear at all, and each
 *     package's name/items/rate) stays synced to the Set's Bill page(s)
 *     as long as at least one Bill page exists in the Set. The user cannot
 *     add/edit/delete packages directly on Invoice/Summary while a Bill
 *     exists — see CanvasArea, which disables those controls in that case.
 *     If a Set has zero Bill pages, Invoice regains full direct package
 *     control (this sync becomes a no-op with nothing to sync from).
 *   - Summary ADDITIONALLY overwrites `quantity` on every line by summing
 *     the Set's Invoice pages (never Bill quantities) — this is the one
 *     thing that still recomputes continuously, since it's meant to always
 *     reflect current invoice totals. A Summary line's quantity is only
 *     ever user-editable in the sense that typing over it works, but the
 *     very next recompute overwrites it again — there is no
 *     "quantityIsOverridden" escape hatch anymore now that Summary is
 *     understood as "an Invoice page whose quantity happens to be a live
 *     total," per the explicit requirement that all three page types share
 *     identical package-row functionality.
 *
 * Multiple Bill pages in a Set are assumed to carry the same packages (per
 * project confirmation — "multiple bill may exist, but all have the same
 * packages, not different"), so only the first Bill page (by the Set's
 * existing date ordering) is consulted as the sync source; there is no
 * merge/union logic across multiple Bills.
 */

/**
 * Syncs an Invoice or Summary page's package list to match a Bill page's
 * packages — adds lines for packages present on the Bill but missing here,
 * removes lines for packages that are on this page but no longer on the
 * Bill, and refreshes packageName/items/rate for lines that still match
 * (in case the Bill's own package edit changed them). Crucially, this
 * NEVER touches `quantity`/`quantityIsOverridden` on a line that already
 * exists here — quantity is independently editable and this sync must not
 * clobber it.
 *
 * If `billPage` is null (no Bill page exists in the Set), returns `page`
 * completely unchanged — direct package control on Invoice takes over
 * instead (see CanvasArea).
 *
 * @param {import('../models/Page.js').Page} page  an Invoice or Summary page
 * @param {import('../models/Page.js').Page|null} billPage
 * @returns {import('../models/Page.js').Page}
 */
export function syncPackagesFromBill(page, billPage) {
  if (!billPage) return page;

  const existingByKey = new Map(
    page.lineItems.map((line) => [
      line.packageId ?? `name:${line.packageName}`,
      line,
    ]),
  );

  const nextLineItems = [];
  let sl = 1;

  for (const billLine of billPage.lineItems) {
    const key = billLine.packageId ?? `name:${billLine.packageName}`;
    const existing = existingByKey.get(key);

    nextLineItems.push({
      id: existing?.id ?? crypto.randomUUID(),
      sl: sl++,
      packageId: billLine.packageId,
      packageName: billLine.packageName,
      items: billLine.items,
      quantity: existing?.quantity ?? null,
      rate: billLine.rate,
      amount: null,
      amountIsOverridden: existing?.amountIsOverridden ?? false,
      quantityIsOverridden: existing?.quantityIsOverridden ?? false,
    });
  }

  return { ...page, lineItems: nextLineItems };
}

/**
 * Overwrites a Summary page's line quantities by summing the matching
 * package's quantity across the Set's Invoice pages. Called AFTER
 * `syncPackagesFromBill` has already established the correct package list
 * for this Summary page, so this only ever updates `quantity` on lines
 * that already exist — it does not add or remove lines itself.
 *
 * @param {import('../models/Page.js').Page} summaryPage
 * @param {import('../models/Page.js').Page[]} invoicePages
 * @returns {import('../models/Page.js').Page}
 */
export function sumInvoiceQuantities(summaryPage, invoicePages) {
  const totals = new Map();
  for (const invoicePage of invoicePages) {
    for (const line of invoicePage.lineItems) {
      const key = line.packageId ?? `name:${line.packageName}`;
      totals.set(key, (totals.get(key) ?? 0) + (line.quantity ?? 0));
    }
  }

  return {
    ...summaryPage,
    lineItems: summaryPage.lineItems.map((line) => {
      const key = line.packageId ?? `name:${line.packageName}`;
      return { ...line, quantity: totals.get(key) ?? 0 };
    }),
  };
}
