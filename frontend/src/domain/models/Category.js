/**
 * @typedef {Object} Category
 * @property {string} id
 * @property {string} name           Bangla display name (e.g. "নাস্তা") — UI-only text,
 *   never printed on any Bill/Invoice/PDF (see Package.js's own note on `text` vs `textBn`
 *   for the equivalent distinction on package items).
 * @property {number} displayOrder   Lower sorts first — see hooks/useCategories.js.
 * @property {string} createdAt  ISO timestamp
 * @property {string} updatedAt  ISO timestamp
 */

/**
 * Creates a new Category with sane defaults.
 *
 * @param {Partial<Category>} input
 * @returns {Category}
 */
export function createCategory(input) {
  const now = new Date().toISOString();
  return {
    id: input.id ?? crypto.randomUUID(),
    name: input.name ?? "",
    displayOrder: input.displayOrder ?? 0,
    createdAt: input.createdAt ?? now,
    updatedAt: now,
  };
}
