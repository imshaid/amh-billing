/**
 * Sort order for a Set's pages in the workspace canvas: বিল pages always
 * first, চালান pages in the middle ordered by date, সামারি pages always
 * last. This is a *display* order, re-derived on every render — there is no
 * persisted "position" field on Page (see docs/data-model.md's Page
 * Ordering, now superseded by this priority rule per later workspace
 * decisions). A newly added page copies its date from whichever page it was
 * added under, so within its own type-group it naturally lands near that
 * page; if its type differs (e.g. adding an Invoice under a Bill), it moves
 * to its own group instead of staying where it was inserted — that's
 * expected, not a bug.
 *
 * @type {Record<import('../models/Page.js').Page['type'], number>}
 */
const TYPE_PRIORITY = { bill: 0, invoice: 1, summary: 2 };

/**
 * @param {import('../models/Page.js').Page[]} pages
 * @returns {import('../models/Page.js').Page[]} a new sorted array; input is not mutated
 */
export function sortPagesForDisplay(pages) {
  return [...pages].sort((a, b) => {
    const priorityDiff = TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type];
    if (priorityDiff !== 0) return priorityDiff;
    // Within the same type-group, order by date; pages sharing a date (e.g.
    // one just duplicated from another) fall back to createdAt so the newer
    // one lands directly after the one it was copied from, matching where
    // the user clicked "add" rather than an arbitrary tie-break.
    const dateDiff = (a.date || "").localeCompare(b.date || "");
    if (dateDiff !== 0) return dateDiff;
    return a.createdAt.localeCompare(b.createdAt);
  });
}
