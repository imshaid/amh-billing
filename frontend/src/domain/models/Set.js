/**
 * @typedef {Object} SetDefaults
 * @property {string} buyerName
 * @property {string[]} defaultPackages   Package ids, applied to new pages in this Set.
 * @property {import('./Page.js').LineItem[]} rowTemplate  Shape copied to new pages.
 */

/**
 * @typedef {Object} Set
 * @property {string} id
 * @property {string} name
 * @property {SetDefaults} defaults
 * @property {string|null} purchaseDate   ISO date (YYYY-MM-DD), optional — set
 *   via the "নতুন সেশন" modal. Never forced: if the user leaves it blank at
 *   creation, it stays null and Previous Sessions/month-grouping fall back
 *   to the Set's first Invoice page's own date (see
 *   PreviousSessionsScreen.jsx), or to `createdAt` if there's no Invoice
 *   either — this field is never silently backfilled with a guessed value
 *   at save time, so `null` here always means "the user didn't say".
 * @property {string|null} orderedByPerson   Free-text name of whoever placed
 *   the order, optional — set via the same modal, with a quick-select list
 *   of previously-used names sourced from every other Set (see
 *   useOrderedByPersons.js). Stored locally only for now — Supabase sync
 *   for this field isn't wired up yet (same as the rest of this app's data;
 *   see docs/data-model.md's Local Cache Policy).
 * @property {string[]} pageIds   Kept in date order — see Page Ordering in the data model doc.
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @param {Partial<Set>} input
 * @returns {Set}
 */
export function createSet(input) {
  const now = new Date().toISOString();
  return {
    id: input.id ?? crypto.randomUUID(),
    name: input.name ?? "",
    defaults: {
      buyerName: input.defaults?.buyerName ?? "",
      defaultPackages: input.defaults?.defaultPackages ?? [],
      rowTemplate: input.defaults?.rowTemplate ?? [],
    },
    purchaseDate: input.purchaseDate ?? null,
    orderedByPerson: input.orderedByPerson ?? null,
    pageIds: input.pageIds ?? [],
    createdAt: input.createdAt ?? now,
    updatedAt: now,
  };
}
