/**
 * Maps between this app's JS domain objects (camelCase, matching
 * domain/models/*.js) and Supabase row shapes (snake_case, matching
 * supabase_schema.sql). Every db/*.repository.js function goes through
 * these — nothing else should hand-roll the field renaming, so a schema
 * change only needs updating in one place.
 *
 * (This file used to live under sync/, back when the app had a separate
 * IndexedDB caching layer with push/pull/LWW merge logic. Per this
 * project's own decision — the hotel has reliable wifi, offline support
 * isn't actually needed, and the dual-storage sync layer was the root
 * cause of recurring duplicate-record bugs — that entire layer was
 * removed and every db/*.repository.js now talks to Supabase directly.
 * This mapping logic is still needed either way, so it moved here rather
 * than being deleted.)
 *
 * Kept as plain object literals (not a generic camelCase<->snake_case string
 * transformer) on purpose: a generic transformer would also "helpfully"
 * rewrite keys *inside* jsonb blobs like `lineItems`/`items`/`defaults`,
 * which must stay camelCase untouched since that's what the rest of the
 * app's domain code (billCalculator, summaryCalculator, etc) expects when
 * a Page/Set/Package comes back from Supabase. Explicit per-table maps
 * avoid that trap entirely.
 */

/** @param {import('../domain/models/Package.js').Package} pkg */
export function packageToRow(pkg) {
  return {
    id: pkg.id,
    name: pkg.name,
    category: pkg.category,
    items: pkg.items,
    rate: pkg.rate,
    seasonal: pkg.seasonal,
    created_at: pkg.createdAt,
    updated_at: pkg.updatedAt,
  };
}

/** @returns {import('../domain/models/Package.js').Package} */
export function rowToPackage(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    items: row.items ?? [],
    rate: row.rate,
    seasonal: row.seasonal,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** @param {import('../domain/models/Set.js').Set} set */
export function setToRow(set) {
  return {
    id: set.id,
    name: set.name,
    defaults: set.defaults,
    purchase_date: set.purchaseDate,
    ordered_by_person: set.orderedByPerson,
    page_ids: set.pageIds,
    created_at: set.createdAt,
    updated_at: set.updatedAt,
  };
}

/** @returns {import('../domain/models/Set.js').Set} */
export function rowToSet(row) {
  return {
    id: row.id,
    name: row.name,
    defaults: row.defaults ?? {
      buyerName: "",
      defaultPackages: [],
      rowTemplate: [],
    },
    purchaseDate: row.purchase_date,
    orderedByPerson: row.ordered_by_person,
    pageIds: row.page_ids ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** @param {import('../domain/models/Page.js').Page} page */
export function pageToRow(page) {
  return {
    id: page.id,
    set_id: page.setId,
    type: page.type,
    buyer_name: page.buyerName,
    address: page.address,
    date: page.date || null, // Postgres `date` column rejects "" — empty/unset must be null
    serial_or_log_code: page.serialOrLogCode,
    line_items: page.lineItems,
    total: page.total,
    total_is_overridden: page.totalIsOverridden,
    note: page.note,
    revision_of: page.revisionOf,
    created_at: page.createdAt,
    updated_at: page.updatedAt,
    synced_at: page.syncedAt,
  };
}

/** @returns {import('../domain/models/Page.js').Page} */
export function rowToPage(row) {
  return {
    id: row.id,
    setId: row.set_id,
    type: row.type,
    buyerName: row.buyer_name,
    address: row.address,
    date: row.date ?? "",
    serialOrLogCode: row.serial_or_log_code,
    lineItems: row.line_items ?? [],
    total: row.total,
    totalIsOverridden: row.total_is_overridden,
    note: row.note,
    revisionOf: row.revision_of,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncedAt: row.synced_at,
  };
}

/** field_history row: { fieldName: string, values: string[] } */
export function fieldHistoryToRow(entry) {
  return {
    field_name: entry.fieldName,
    values: entry.values,
    updated_at: entry.updatedAt ?? new Date().toISOString(),
  };
}

export function rowToFieldHistory(row) {
  return {
    fieldName: row.field_name,
    values: row.values ?? [],
    updatedAt: row.updated_at,
  };
}
