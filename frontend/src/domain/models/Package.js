/**
 * @typedef {Object} PackageItem
 * @property {string} id
 * @property {string} text     English item description — printed on Bill/
 *   Invoice/PDF exactly as before. Never changed by textBn's existence.
 * @property {string} [textBn]  Bangla translation, optional. Shown ONLY in
 *   PackageItemsModal's popup (see features/package-picker) — per this
 *   project's own decision, the printed document keeps using `text`
 *   (English) regardless of whether `textBn` is present. Older
 *   Packages/LineItems created before this field existed simply lack it;
 *   treat its absence as "no Bangla translation available yet", not an
 *   error — see PackageItemsModal's own fallback handling.
 */

/**
 * @typedef {Object} Package
 * @property {string} id
 * @property {string} name
 * @property {string|null} categoryId  References Category.id (see
 *   domain/models/Category.js) — categories are now a real, user-managed
 *   table rather than a fixed Snacks/Lunch/Iftar/null enum (see this
 *   project's own decision to support fully dynamic categories). `null`
 *   is no longer a meaningful value for new Packages — every Package
 *   should have a real categoryId once the "সাধারণ" (Normal/à la carte)
 *   category exists as a real row too — but is tolerated for any
 *   Package that predates this migration and hasn't been re-saved yet.
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
  const now = new Date().toISOString();
  return {
    id: input.id ?? crypto.randomUUID(),
    name: input.name ?? "",
    categoryId: input.categoryId ?? null,
    items: input.items ?? [],
    rate: input.rate ?? null,
    seasonal: input.seasonal ?? null,
    createdAt: input.createdAt ?? now,
    updatedAt: now,
  };
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
  return pkg.items.map((item) => ({ ...item }));
}
