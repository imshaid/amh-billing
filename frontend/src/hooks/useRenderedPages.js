import { useMemo } from "react";
import {
  syncPackagesFromBill,
  sumInvoiceQuantities,
} from "../domain/aggregation/summaryCalculator.js";
import { recomputeBillTotals } from "../domain/aggregation/billCalculator.js";

/**
 * Applies the same live recomputation useActivePage used to apply to a
 * single page to every page in the Set at once. Needed now that the
 * workspace renders all pages in one continuous scroll (Chrome-PDF-viewer
 * style) instead of showing only the active page, so each page must be
 * independently render-ready.
 *
 * Per the corrected mental model (see summaryCalculator.js's top doc
 * comment): Bill is the only page type with direct package control.
 * Invoice and Summary both get their package list synced from the Set's
 * first Bill page (by existing date order — multiple Bills are assumed to
 * carry identical packages, so only the first is consulted); if no Bill
 * page exists, the sync is a no-op and Invoice keeps whatever packages it
 * already has under direct control. Summary additionally has its quantity
 * overwritten by summing the Set's Invoice pages, on top of the same
 * Bill-synced package list.
 *
 * @param {import('../domain/models/Page.js').Page[]|null} pages
 * @returns {import('../domain/models/Page.js').Page[]}
 */
export function useRenderedPages(pages) {
  return useMemo(() => {
    if (!pages) return [];
    const invoicePages = pages.filter((p) => p.type === "invoice");
    // Multiple Bills in a Set are assumed identical in package content (see
    // domain/aggregation/summaryCalculator.js's top comment) — only the
    // first one (already date-ordered by getPagesBySet) is used as the
    // sync source, no merge across Bills.
    const firstBillPage = pages.find((p) => p.type === "bill") ?? null;

    return pages.map((page) => {
      if (page.type === "bill") return recomputeBillTotals(page);
      if (page.type === "invoice")
        return syncPackagesFromBill(page, firstBillPage);
      if (page.type === "summary") {
        const synced = syncPackagesFromBill(page, firstBillPage);
        return sumInvoiceQuantities(synced, invoicePages);
      }
      return page;
    });
  }, [pages]);
}
