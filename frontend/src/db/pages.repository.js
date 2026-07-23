import { getDB } from "./client.js";
import { STORE } from "./schema.js";
import {
  createPage,
  createSummaryPage,
  duplicateAsRevision,
  duplicatePageAsNew,
} from "../domain/models/Page.js";
import { schedulePush, cancelPush } from "../sync/pushQueue.js";
import { pushPage, deletePageRemote } from "../sync/syncEngine.js";
import { ensureSetPushed } from "../sync/ensureSetPushed.js";

/**
 * Schedules a debounced Supabase push for a page, then — once the push
 * actually completes — stamps `syncedAt` onto the IndexedDB row. This is
 * the one place `syncedAt` gets set; every write path below that changes
 * `lineItems`/fields calls this afterward rather than setting `syncedAt`
 * itself, so there's exactly one source of truth for "this exact version
 * made it to the cloud".
 *
 * Uses the page's own `id` as the debounce key (`page:${id}`) — see
 * pushQueue.js's own doc comment on why debouncing is per-record, not
 * global.
 *
 * Calls `ensureSetPushed` first — fixes a real bug found during testing:
 * `pages.set_id` has a foreign-key constraint against `sets.id` (see
 * supabase_schema.sql), but a brand-new Set and its very first Page(s)
 * each schedule their own independently-debounced push with no ordering
 * between them, so the Page's push could reach Supabase before the Set's
 * own push had landed — Postgres then rejects the Page insert outright
 * ("Key is not present in table sets"). `ensureSetPushed` guarantees the
 * parent Set exists in Supabase before this function's own push runs;
 * see that function's own doc comment in sync/ensureSetPushed.js (also
 * explains why it lives there rather than in sets.repository.js).
 *
 * @param {import('../domain/models/Page.js').Page} page
 */
function schedulePagePush(page) {
  schedulePush(`page:${page.id}`, async () => {
    await ensureSetPushed(page.setId);
    await pushPage(page);
    const db = await getDB();
    const current = await db.get(STORE.PAGES, page.id);
    // Guard against the row having been deleted locally while this push
    // was still in flight — re-inserting it here would resurrect a
    // page the user already deleted.
    if (current) {
      await db.put(STORE.PAGES, {
        ...current,
        syncedAt: new Date().toISOString(),
      });
    }
  });
}

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
  schedulePagePush(page);
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
  schedulePagePush(page);
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
  schedulePagePush(page);
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
  schedulePagePush(updated);
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
  schedulePagePush(revision);
  return revision;
}

/**
 * Deletes a page locally and from Supabase. `cancelPush` runs first so a
 * push that was still debouncing for this exact page can never fire
 * *after* the delete and silently re-insert the row on the server (see
 * pushQueue.js's own doc comment on cancelPush).
 *
 * The remote delete itself is fire-and-forget — awaited, but its failure
 * is only logged, not thrown, since the local delete (the part the user
 * actually sees) already succeeded by the time it runs; see
 * schedulePush's own reasoning for why sync failures never surface as a
 * broken UI.
 *
 * @param {string} id
 */
export async function deletePage(id) {
  cancelPush(`page:${id}`);
  const db = await getDB();
  await db.delete(STORE.PAGES, id);
  deletePageRemote(id).catch((err) =>
    console.warn(`[amh-billing] Supabase delete failed for page:${id}:`, err),
  );
}

/**
 * Rows eligible for the 60-day local cache purge: already synced to Supabase
 * and older than the cutoff. Supabase keeps the permanent copy — this only
 * trims what's kept on-device. See "Local Cache Policy" in docs/data-model.md.
 *
 * Default matches sync/purge.js's PURGE_MAX_AGE_DAYS — pass an explicit
 * value here only if you deliberately want a different window than the
 * one the actual purge routine uses (e.g. for testing).
 *
 * @param {number} maxAgeDays
 * @returns {Promise<import('../domain/models/Page.js').Page[]>}
 */
export async function getPurgeableSyncedPages(maxAgeDays = 60) {
  const db = await getDB();
  const cutoff = new Date(
    Date.now() - maxAgeDays * 24 * 60 * 60 * 1000,
  ).toISOString();
  const synced = await db.getAllFromIndex(STORE.PAGES, "by_syncedAt");
  return synced.filter((page) => page.syncedAt && page.syncedAt < cutoff);
}
