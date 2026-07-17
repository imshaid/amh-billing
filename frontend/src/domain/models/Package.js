/**
 * @typedef {Object} PackageItem
 * @property {string} id
 * @property {string} text
 */

/**
 * @typedef {Object} Package
 * @property {string} id
 * @property {string} name
 * @property {"Snacks"|"Lunch"|"Iftar"|null} category
 * @property {PackageItem[]} items
 * @property {number|null} rate
 * @property {"ramadan"|null} seasonal
 * @property {string} createdAt  ISO timestamp
 * @property {string} updatedAt  ISO timestamp
 */

/**
 * Creates a new Package with sane defaults. Callers only need to supply the
 * fields that differ — everything else is filled in.
 *
 * @param {Partial<Package>} input
 * @returns {Package}
 */
export function createPackage(input) {
  const now = new Date().toISOString()
  return {
    id: input.id ?? crypto.randomUUID(),
    name: input.name ?? '',
    category: input.category ?? null,
    items: input.items ?? [],
    rate: input.rate ?? null,
    seasonal: input.seasonal ?? null,
    createdAt: input.createdAt ?? now,
    updatedAt: now,
  }
}

/**
 * Returns a deep copy of a package's items, suitable for snapshotting onto a
 * LineItem. Always call this rather than assigning `package.items` directly —
 * see "Snapshot Policy" in docs/data-model.md.
 *
 * @param {Package} pkg
 * @returns {PackageItem[]}
 */
export function snapshotPackageItems(pkg) {
  return pkg.items.map((item) => ({ ...item }))
}
