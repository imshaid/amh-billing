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
 * @property {string[]} pageIds   Kept in date order — see Page Ordering in the data model doc.
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @param {Partial<Set>} input
 * @returns {Set}
 */
export function createSet(input) {
  const now = new Date().toISOString()
  return {
    id: input.id ?? crypto.randomUUID(),
    name: input.name ?? '',
    defaults: {
      buyerName: input.defaults?.buyerName ?? '',
      defaultPackages: input.defaults?.defaultPackages ?? [],
      rowTemplate: input.defaults?.rowTemplate ?? [],
    },
    pageIds: input.pageIds ?? [],
    createdAt: input.createdAt ?? now,
    updatedAt: now,
  }
}
