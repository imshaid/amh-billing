import { supabase } from "./supabaseClient.js";
import { pageToRow, rowToPage } from "./rowMapping.js";
import {
  createPage,
  createSummaryPage,
  duplicateAsRevision,
  duplicatePageAsNew,
} from "../domain/models/Page.js";

/**
 * All reads/writes to Pages go through this file, straight to Supabase —
 * no IndexedDB, no debounce, no LWW merge, no local purge (see this
 * project's own decision to remove the IndexedDB caching layer entirely
 * — see packages.repository.js's own doc comment for the full
 * reasoning). Every function here is a direct, awaited Supabase call.
 *
 * `pages.set_id` has a foreign-key constraint against `sets.id` (see
 * supabase_schema.sql) — a Page insert will fail with a real, visible
 * error if its Set doesn't exist yet, rather than silently succeeding
 * and needing a separate "make sure the Set landed first" step (the old
 * IndexedDB-era `ensureSetPushed` existed only to paper over *that*
 * layer's own debounce-ordering problem, which no longer exists once
 * every write is an immediate, awaited call).
 */

/** @returns {Promise<import('../domain/models/Page.js').Page|undefined>} */
export async function getPageById(id) {
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToPage(data) : undefined;
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
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("set_id", setId)
    .order("date", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToPage);
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
  const page = createPage(input);
  const { error } = await supabase.from("pages").insert(pageToRow(page));
  if (error) throw error;
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
  const page = duplicatePageAsNew(sourcePage, {
    setId: sourcePage.setId,
    type,
  });
  const { error } = await supabase.from("pages").insert(pageToRow(page));
  if (error) throw error;
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
  const page = createSummaryPage(input);
  const { error } = await supabase.from("pages").insert(pageToRow(page));
  if (error) throw error;
  return page;
}

/**
 * Mutates a page in place. ONLY safe to call while the page is still a draft
 * that has not been generated/shared as a PDF yet (e.g. still being edited in
 * the live preview before first export). Once a page has been exported, use
 * `revisePage` instead.
 *
 * @param {string} id
 * @param {Partial<import('../domain/models/Page.js').Page>} changes
 */
export async function updateDraftPage(id, changes) {
  const existing = await getPageById(id);
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
  const { error } = await supabase
    .from("pages")
    .update(pageToRow(updated))
    .eq("id", id);
  if (error) throw error;
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
  const original = await getPageById(originalPageId);
  if (!original) {
    throw new Error(`Page not found: ${originalPageId}`);
  }
  const revision = duplicateAsRevision(original, changes);
  const { error } = await supabase.from("pages").insert(pageToRow(revision));
  if (error) throw error;
  return revision;
}

/** @param {string} id */
export async function deletePage(id) {
  const { error } = await supabase.from("pages").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Subscribes to live Page changes via Supabase Realtime — see
 * packages.repository.js's subscribeToPackages for the full reasoning
 * (row-level live sync across devices, not keystroke-level). Scoped to a
 * single Set (`set_id=eq.${setId}` filter) rather than every Page in the
 * whole app, since a workspace view only ever needs updates for the Set
 * it's currently showing.
 *
 * @param {string} setId
 * @param {() => void} onChange
 * @returns {() => void} unsubscribe
 */
export function subscribeToPagesBySet(setId, onChange) {
  const channel = supabase
    .channel(`pages-changes-${setId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "pages",
        filter: `set_id=eq.${setId}`,
      },
      onChange,
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
