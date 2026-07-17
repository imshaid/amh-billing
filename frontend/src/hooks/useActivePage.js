import { useMemo } from "react";
import { recomputeSummaryLines } from "../domain/aggregation/summaryCalculator.js";
import { recomputeBillTotals } from "../domain/aggregation/billCalculator.js";

/**
 * Derives the Page object the canvas should render, given the full list of
 * Pages already loaded for the active Set (see `usePages`) and the currently
 * active page id (see `useAppState`).
 *
 * Two calculations happen here rather than being baked into the stored Page,
 * because both are meant to be *live* per docs/data-model.md:
 *   - type "summary": lineItems.quantity is re-summed from every invoice page
 *     in the Set on every render, except lines with quantityIsOverridden.
 *   - type "bill": amounts/total are recomputed from quantity×rate, except
 *     wherever amountIsOverridden/totalIsOverridden is set.
 * Invoice pages need neither (no rate/amount/total), so they pass through
 * unchanged.
 *
 * @param {import('../domain/models/Page.js').Page[]|null} pages   all pages in the active Set
 * @param {string|null} activePageId
 * @returns {import('../domain/models/Page.js').Page|null}
 */
export function useActivePage(pages, activePageId) {
  return useMemo(() => {
    if (!pages || !activePageId) return null;

    const page = pages.find((p) => p.id === activePageId);
    if (!page) return null;

    if (page.type === "summary") {
      const invoicePages = pages.filter((p) => p.type === "invoice");
      return recomputeSummaryLines(page, invoicePages);
    }

    if (page.type === "bill") {
      return recomputeBillTotals(page);
    }

    return page;
  }, [pages, activePageId]);
}
