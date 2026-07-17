import { useMemo } from "react";
import { recomputeSummaryLines } from "../domain/aggregation/summaryCalculator.js";
import { recomputeBillTotals } from "../domain/aggregation/billCalculator.js";

/**
 * Applies the same live recomputation useActivePage used to apply to a
 * single page — summary aggregation, bill totals — to every page in the
 * Set at once. Needed now that the workspace renders all pages in one
 * continuous scroll (Chrome-PDF-viewer style) instead of showing only the
 * active page, so each page must be independently render-ready.
 *
 * @param {import('../domain/models/Page.js').Page[]|null} pages
 * @returns {import('../domain/models/Page.js').Page[]}
 */
export function useRenderedPages(pages) {
  return useMemo(() => {
    if (!pages) return [];
    const invoicePages = pages.filter((p) => p.type === "invoice");
    return pages.map((page) => {
      if (page.type === "summary")
        return recomputeSummaryLines(page, invoicePages);
      if (page.type === "bill") return recomputeBillTotals(page);
      return page;
    });
  }, [pages]);
}
