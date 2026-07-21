import { getDB } from "./client.js";
import { STORE } from "./schema.js";
import {
  createPage,
  createSummaryPage,
  duplicateAsRevision,
  duplicatePageAsNew,
} from "../domain/models/Page.js";

/** @returns {Promise<import('../domain/models/Page.js').Page|undefined>} */
export async function getPageById(id) {
  const db = await getDB();
  return db.get(STORE.PAGES, id);
}

/**
 * All pages belonging to a Set, ordered by date ascending (see "Page
 * Ordering" in docs/data-model.md). This is the query the print/export flow
 * and the summary aggregator both rely on.
 *
 * @param {string} setId
 * @returns {Promise<import('../domain/models/Page.js').Page[]>}
 */
export async function getPagesBySet(setId) {
  const db = await getDB();
  const range = IDBKeyRange.bound([setId, ""], [setId, "\uffff"]);
  return db.getAllFromIndex(STORE.PAGES, "by_setId_date", range);
}

/**
 * Only the invoice pages in a Set — what the Summary aggregator sums over.
 * @param {string} setId
 */
export async function getInvoicePagesBySet(setId) {
  const pages = await getPagesBySet(setId);
  return pages.filter((p) => p.type === "invoice");
}

/**
 * Creates and persists a brand new Page (first time it's created — not an
 * edit of an existing one).
 *
 * @param {Partial<import('../domain/models/Page.js').Page> & { setId: string, type: import('../domain/models/Page.js').Page['type'] }} input
 */
export async function addPage(input) {
  const db = await getDB();
  const page = createPage(input);
  await db.add(STORE.PAGES, page);
  return page;
}

/**
 * Creates and persists a new Page pre-filled from `sourcePage` (buyerName,
 * address, date, lineItems all copied — see `duplicatePageAsNew`). This is
 * what the workspace's per-page "+ নতুন বিল/চালান" buttons call — every new
 * Bill/Invoice page after the first one in a Set starts as a copy of
 * whichever page it was added under, never blank.
 *
 * NOT used for "+ নতুন সামারি" — see `addSummaryPage` instead.
 *
 * @param {import('../domain/models/Page.js').Page} sourcePage
 * @param {import('../domain/models/Page.js').Page['type']} type
 */
export async function addDuplicatedPage(sourcePage, type) {
  const db = await getDB();
  const page = duplicatePageAsNew(sourcePage, {
    setId: sourcePage.setId,
    type,
  });
  await db.add(STORE.PAGES, page);
  return page;
}

/**
 * Creates and persists a new Summary page. Per `createSummaryPage`'s own
 * doc comment, only `buyerName` carries over — address/date/serialOrLogCode
 * start blank, and lineItems starts empty since it's always recomputed at
 * render time from the Set's Invoice (or, absent those, Bill) pages.
 *
 * @param {{ setId: string, buyerName?: string }} input
 */
export async function addSummaryPage(input) {
  const db = await getDB();
  const page = createSummaryPage(input);
  await db.add(STORE.PAGES, page);
  return page;
}

/**
 * Mutates a page in place. ONLY safe to call while the page is still a draft
 * that has not been generated/shared as a PDF yet (e.g. still being edited in
 * the live preview before first export). Once a page has been exported, use
 * `reviseePage` instead.
 *
 * @param {string} id
 * @param {Partial<import('../domain/models/Page.js').Page>} changes
 */
export async function updateDraftPage(id, changes) {
  const db = await getDB();
  const existing = await db.get(STORE.PAGES, id);
  if (!existing) {
    throw new Error(`Page not found: ${id}`);
  }
  const updated = {
    ...existing,
    ...changes,
    id,
    setId: existing.setId, // never allow setId to change via update
    updatedAt: new Date().toISOString(),
  };
  await db.put(STORE.PAGES, updated);
  return updated;
}

/**
 * Implements the History Edit Policy. Call this — never `updateDraftPage` —
 * once a page has already been generated/shared. Persists a brand new Page
 * row; the original row is left completely untouched.
 *
 * @param {string} originalPageId
 * @param {Partial<import('../domain/models/Page.js').Page>} changes
 * @returns {Promise<import('../domain/models/Page.js').Page>} the new revision
 */
export async function revisePage(originalPageId, changes) {
  const db = await getDB();
  const original = await db.get(STORE.PAGES, originalPageId);
  if (!original) {
    throw new Error(`Page not found: ${originalPageId}`);
  }
  const revision = duplicateAsRevision(original, changes);
  await db.add(STORE.PAGES, revision);
  return revision;
}

/** @param {string} id */
export async function deletePage(id) {
  const db = await getDB();
  await db.delete(STORE.PAGES, id);
}

/**
 * Rows eligible for the 30-day local cache purge: already synced to Supabase
 * and older than the cutoff. Supabase keeps the permanent copy — this only
 * trims what's kept on-device. See "Local Cache Policy" in docs/data-model.md.
 *
 * @param {number} maxAgeDays
 * @returns {Promise<import('../domain/models/Page.js').Page[]>}
 */
export async function getPurgeableSyncedPages(maxAgeDays = 30) {
  const db = await getDB();
  const cutoff = new Date(
    Date.now() - maxAgeDays * 24 * 60 * 60 * 1000,
  ).toISOString();
  const synced = await db.getAllFromIndex(STORE.PAGES, "by_syncedAt");
  return synced.filter((page) => page.syncedAt && page.syncedAt < cutoff);
}
