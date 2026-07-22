import { useState, useEffect } from "react";
import { getPagesBySet } from "../db/pages.repository.js";
import { recomputeBillTotals } from "../domain/aggregation/billCalculator.js";

/**
 * @typedef {Object} SessionSummary
 * @property {import('../domain/models/Set.js').Set} set
 * @property {string} buyerName        From the Set's one Bill page (the
 *   design decision behind this feature: exactly one Bill page per Set,
 *   though multiple Invoice/Summary pages are fine — see
 *   docs/data-model.md). Falls back to `set.defaults.buyerName` if there's
 *   no Bill page yet (a brand new, still-empty session).
 * @property {number|null} total       The Bill page's total, live-recomputed
 *   from its own lineItems via `recomputeBillTotals` (same function
 *   CanvasArea's `useRenderedPages` uses for the on-screen view) rather
 *   than trusting the Bill page's raw stored `total` field. Storage writes
 *   from quantity/rate edits (see CanvasArea's `handleLineChange`) only
 *   ever persist the edited `lineItems` themselves — `total`/line `amount`
 *   are recomputed on the fly for display and were never written back to
 *   IndexedDB, so the raw stored value can be stale or still `null` even
 *   after the Bill page visibly shows a correct total in the workspace.
 *   Recomputing here (same as the workspace already does) is what makes
 *   this screen agree with what the user actually sees on the Bill page,
 *   without changing anything about how edits get saved.
 * @property {string|null} displayDate The date actually shown in the list:
 *   `set.purchaseDate` if the user provided one, else the earliest Invoice
 *   page's `date`, else `set.createdAt`. See Set.js's own doc comment on
 *   why `purchaseDate` is never guessed/backfilled onto the Set itself —
 *   this fallback chain lives here, at read time, instead.
 * @property {string|null} orderedByPerson
 * @property {number} pageCount
 */

/**
 * Loads and aggregates the per-Set summary data the Previous Sessions
 * screen needs, one `getPagesBySet` call per Set. This is intentionally
 * N+1 (not a single cross-Set query) — there is no aggregate index for
 * "each Set's Bill total"; the alternative would be loading every Page in
 * the database up front regardless of Set count, which does not scale
 * better. For the data volumes this app deals with (a hotel's own daily
 * billing, not a multi-tenant SaaS), N+1 over Sets is the simpler and
 * cheaper approach.
 *
 * Re-runs whenever `sets` changes (new session created, a session's pages
 * edited elsewhere and `sets`'s `updatedAt` bumped, etc) — see useSets.js
 * for how that array itself gets refreshed.
 *
 * @param {import('../domain/models/Set.js').Set[]} sets
 * @returns {{ summaries: SessionSummary[], status: "loading"|"ready"|"error" }}
 */
export function useSessionSummaries(sets) {
  const [summaries, setSummaries] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      try {
        const results = await Promise.all(
          sets.map(async (set) => {
            const pages = await getPagesBySet(set.id);
            const billPage = pages.find((p) => p.type === "bill");
            const firstInvoice = pages.find((p) => p.type === "invoice");

            return {
              set,
              buyerName: billPage?.buyerName || set.defaults?.buyerName || "",
              total: billPage ? recomputeBillTotals(billPage).total : null,
              displayDate:
                set.purchaseDate || firstInvoice?.date || set.createdAt,
              orderedByPerson: set.orderedByPerson ?? null,
              pageCount: pages.length,
            };
          }),
        );
        if (!cancelled) {
          setSummaries(results);
          setStatus("ready");
        }
      } catch (err) {
        console.error("[useSessionSummaries] failed to load:", err);
        if (!cancelled) setStatus("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sets]);

  return { summaries, status };
}
