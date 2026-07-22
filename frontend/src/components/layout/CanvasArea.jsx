import { useRef, useState } from "react";
import { useRenderedPages } from "../../hooks/useRenderedPages.js";
import { sortPagesForDisplay } from "../../domain/aggregation/pageSort.js";
import {
  updateDraftPage,
  addPage,
  addDuplicatedPage,
  addSummaryPage,
  deletePage,
} from "../../db/pages.repository.js";
import { resyncSetPageOrder } from "../../db/sets.repository.js";
import { createLineItemFromPackage } from "../../domain/models/Page.js";
import BillPage from "../../features/bill/BillPage.jsx";
import InvoicePage from "../../features/invoice/InvoicePage.jsx";
import PackagePickerPopup from "../../features/package-picker/PackagePickerPopup.jsx";
import ConfirmDialog from "../../features/shared/ConfirmDialog.jsx";
import PageActionBar from "./PageActionBar.jsx";
import styles from "./CanvasArea.module.css";

/**
 * Renders every Page in the active Set as one continuous scrollable canvas
 * (Chrome-PDF-viewer style), sorted by `sortPagesForDisplay` — বিল pages
 * first, চালান by date in the middle, সামারি last — rather than raw
 * insertion order. `useRenderedPages` applies the same live recomputation
 * (summary aggregation, bill totals) useActivePage used to apply to a
 * single page, to all of them at once.
 *
 * Each page's DOM node is kept in `pageRefs` so PageCountNav's dropdown can
 * scroll a specific page into view (see `scrollToPage`, exposed via the
 * `registerScrollApi` callback passed up to WorkspaceView).
 *
 * A PageActionBar renders below every page (+ নতুন বিল/চালান/সামারি,
 * ডিলিট). For Bill/Invoice, clicking an add button duplicates *that* page's
 * buyerName/address/date/lineItems into a fresh page via `addDuplicatedPage`
 * (see domain/models/Page.js's duplicatePageAsNew), never starting blank.
 * Summary is different: only buyerName carries over (see createSummaryPage's
 * doc comment) — its lineItems start empty and are then populated by the
 * same Bill-sync/Invoice-sum logic every other Summary page already gets
 * (see useRenderedPages), not copied from any specific source page — so
 * "+ নতুন সামারি" goes through `addSummaryPage` instead. There is
 * deliberately no "duplicate" button separate from these — the Bill/Invoice
 * add buttons already are the duplicate action.
 *
 * Inline edits write straight to IndexedDB via `updateDraftPage` — this is
 * safe because, per the History Edit Policy in docs/data-model.md, a page
 * only needs `revisePage` once it has actually been generated/exported as a
 * PDF; since PDF export isn't built yet, every page in this app is still a
 * draft. `refreshPages` is called after each write so the shared `pages`
 * state (and therefore live totals every other page depends on, e.g.
 * Summary) updates immediately.
 *
 * Package management model (see domain/aggregation/summaryCalculator.js's
 * top doc comment for the full rationale): Bill is the only page type
 * where the user directly adds/edits/deletes packages. Invoice and Summary
 * are otherwise completely normal, independently-editable pages (their
 * quantity field is always directly editable), but their *package list*
 * stays synced to the Set's Bill page as long as one exists —
 * `useRenderedPages` handles that sync every render, and `canManagePackages`
 * (computed below from whether any Bill page exists) disables the
 * add/edit/delete controls on Invoice/Summary in that case. If a Set has no
 * Bill page at all, Invoice regains full direct package control (the sync
 * has nothing to sync from) — Summary never gets direct control either
 * way, since a Summary page cannot exist without at least a Bill or
 * Invoice already present in the Set to summarize.
 *
 * Packages have exactly two entry points per row, both always visible on
 * pages where `canManagePackages` is true — see BillPage/InvoicePage's own
 * doc comments for the full rationale:
 *   - The "+" to the left of every row (LineItemActions) inserts a new
 *     package at that row's position; when a page has zero lineItems, a
 *     single blank placeholder row still shows this button.
 *   - Clicking a row's package name (PackageRowMenu) opens Edit (replace
 *     this row's package) / Delete (remove this row, after confirmation).
 * There is no separate "append to end" control — every add is anchored to
 * a specific row (or the blank placeholder), which is what
 * `packagePickerContext`'s `mode: "insertAfter"|"replace"` tracks.
 *
 * The package-picker popup is owned here (not inside BillPage/InvoicePage)
 * because it needs to know which page — and, for insert/replace, which
 * line — triggered it (`packagePickerContext`), and hands the result back
 * to that exact page/line. It also receives that page's current packageId
 * set so already-added packages show dimmed and un-clickable (no duplicate
 * packages within one table); see `existingPackageIds` for how "replace"
 * mode excludes the very line being replaced from that check.
 *
 * There is no "apply to all pages?" prompt anywhere in this component —
 * every field edit and package add/edit/delete applies immediately and
 * only to the page it was performed on (packages additionally propagate
 * to Invoice/Summary automatically via the Bill-sync described above, but
 * that's a passive consequence of the sync, not a choice the user is asked
 * to make). The only confirmation dialog in this file is for delete (page
 * delete and line-item delete, both via ConfirmDialog).
 *
 * @param {{
 *   activeSetId: string|null,
 *   pages: import('../../domain/models/Page.js').Page[]|null,
 *   status: "idle"|"loading"|"ready"|"error",
 *   refreshPages: () => Promise<void>,
 *   zoom: number,
 *   registerScrollApi: (api: {
 *     scrollToPage: (pageId: string) => void,
 *     getViewportSize: () => { width: number, height: number },
 *   }) => void,
 * }} props
 */
export default function CanvasArea({
  activeSetId,
  pages,
  status,
  refreshPages,
  zoom,
  registerScrollApi,
}) {
  const renderedPages = sortPagesForDisplay(useRenderedPages(pages));
  const pageRefs = useRef(new Map());
  const canvasRef = useRef(null);
  // Replaces the old plain `addingToPageId` string — the package picker now
  // has two distinct triggers (insert after a specific line, or replace a
  // specific line's package), both needing to know which page and which
  // line (if any) they're targeting.
  // Shape: { pageId, mode: "insertAfter"|"replace", afterLineId?: string|null, replaceLineId? }
  // `afterLineId: null` means "this page currently has zero line items" —
  // the picked package becomes the page's first (and only) line.
  const [packagePickerContext, setPackagePickerContext] = useState(null);
  const [deletingPageId, setDeletingPageId] = useState(null);
  // { pageId, lineId } for a line item awaiting delete confirmation.
  const [deletingLineItem, setDeletingLineItem] = useState(null);

  if (registerScrollApi) {
    registerScrollApi({
      scrollToPage: (pageId) => {
        pageRefs.current
          .get(pageId)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      },
      // Used by ZoomControl's fit-width/fit-height buttons (see
      // AppRouter/GlobalTopBar) to compute what zoom level makes the
      // fixed-A4-size page match the space actually available.
      // clientWidth/Height already excludes any scrollbar, and .canvas's
      // own padding (see CanvasArea.module.css) is subtracted here so "fit"
      // doesn't leave the page pressed flush against the viewport edge.
      // This measurement only means what it says now that .pageWrapper no
      // longer has `max-width: 100%` (see CanvasArea.module.css) — that
      // rule used to silently re-clamp the zoomed page back down to this
      // exact width/height, which is what made the computed fit percentage
      // disagree with what actually rendered.
      getViewportSize: () => {
        const el = canvasRef.current;
        if (!el) return { width: 0, height: 0 };
        const computed = window.getComputedStyle(el);
        const paddingX =
          parseFloat(computed.paddingLeft) + parseFloat(computed.paddingRight);
        const paddingY =
          parseFloat(computed.paddingTop) + parseFloat(computed.paddingBottom);
        return {
          width: el.clientWidth - paddingX,
          height: el.clientHeight - paddingY,
        };
      },
    });
  }

  async function handleFieldChange(pageId, field, value) {
    await updateDraftPage(pageId, { [field]: value });
    await refreshPages();
  }

  async function handleLineChange(pageId, lineId, field, value) {
    // For any page, `lineItems` in raw storage might have a slightly
    // different package set than what's currently rendered if a Bill-sync
    // (see syncPackagesFromBill in useRenderedPages) is pending — the line
    // being edited must be looked up in `renderedPages` (the synced view),
    // not `pages` (raw storage), or the edit could target a stale line id.
    const page = renderedPages.find((p) => p.id === pageId);
    if (!page) return;
    const numericValue = value === "" ? null : Number(value);
    const overrideFlag =
      field === "quantity" ? "quantityIsOverridden" : "amountIsOverridden";
    const nextLineItems = page.lineItems.map((line) =>
      line.id === lineId
        ? { ...line, [field]: numericValue, [overrideFlag]: true }
        : line,
    );
    await updateDraftPage(pageId, { lineItems: nextLineItems });
    await refreshPages();
  }

  /** Renumbers every line item's `sl` to 1..N in its current order — called
   * after any insert/delete so SL always reflects actual row position, per
   * the requirement that SL stays correct after add/delete. */
  function renumbered(lineItems) {
    return lineItems.map((line, i) => ({ ...line, sl: i + 1 }));
  }

  async function handlePickPackage(pkg) {
    if (!packagePickerContext) return;
    const { pageId, mode, afterLineId, replaceLineId } = packagePickerContext;
    const page = renderedPages.find((p) => p.id === pageId);
    if (!page) return;

    let nextLineItems;
    if (mode === "insertAfter") {
      const newLine = createLineItemFromPackage(pkg, { sl: 0 });
      if (afterLineId === null) {
        // Page had zero line items (the blank placeholder row) — this
        // becomes the only one.
        nextLineItems = [newLine];
      } else {
        const index = page.lineItems.findIndex((l) => l.id === afterLineId);
        nextLineItems = [
          ...page.lineItems.slice(0, index + 1),
          newLine,
          ...page.lineItems.slice(index + 1),
        ];
      }
    } else {
      // "replace" — a fresh snapshot of the newly picked package takes over
      // this row entirely; quantity resets (it described the old package,
      // not this one) and override flags clear along with it.
      nextLineItems = page.lineItems.map((line) =>
        line.id === replaceLineId
          ? createLineItemFromPackage(pkg, { sl: 0, id: line.id })
          : line,
      );
    }

    await updateDraftPage(pageId, { lineItems: renumbered(nextLineItems) });
    await refreshPages();
    setPackagePickerContext(null);
  }

  async function handleConfirmDeleteLineItem() {
    if (!deletingLineItem) return;
    const { pageId, lineId } = deletingLineItem;
    const page = renderedPages.find((p) => p.id === pageId);
    if (!page) return;
    const nextLineItems = renumbered(
      page.lineItems.filter((line) => line.id !== lineId),
    );
    await updateDraftPage(pageId, { lineItems: nextLineItems });
    await refreshPages();
    setDeletingLineItem(null);
  }

  async function handleAddPageAfter(sourcePageId, type) {
    const sourcePage = renderedPages.find((p) => p.id === sourcePageId);
    if (!sourcePage) return;
    // Summary is not a duplicate of sourcePage — only buyerName carries
    // over, and its lineItems start empty, then get populated by the
    // Bill-sync/Invoice-sum logic every Summary page gets (see
    // useRenderedPages), never copied. See createSummaryPage's doc comment
    // for why this needs its own path instead of duplicatePageAsNew.
    const newPage =
      type === "summary"
        ? await addSummaryPage({
            setId: activeSetId,
            buyerName: sourcePage.buyerName,
          })
        : await addDuplicatedPage(sourcePage, type);
    await resyncSetPageOrder(activeSetId);
    await refreshPages();
    requestAnimationFrame(() =>
      pageRefs.current
        .get(newPage.id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }

  // Only used for the very first page in an empty Set — there is nothing
  // yet to duplicate from, so Bill/Invoice fall back to plain `addPage`
  // here. Summary still goes through `addSummaryPage` even as the first
  // page, since it never copies lineItems from anything regardless of
  // whether a source page exists.
  async function handleCreateFirstPage(type) {
    if (!activeSetId) return;
    if (type === "summary") {
      await addSummaryPage({ setId: activeSetId });
    } else {
      await addPage({ setId: activeSetId, type });
    }
    await resyncSetPageOrder(activeSetId);
    await refreshPages();
  }

  async function handleConfirmDeletePage() {
    if (!deletingPageId) return;
    await deletePage(deletingPageId);
    await resyncSetPageOrder(activeSetId);
    await refreshPages();
    setDeletingPageId(null);
  }

  if (!activeSetId) {
    return (
      <div className={styles.canvas} ref={canvasRef}>
        <div className={styles.emptyState}>
          <p className={styles.emptyStateTitle}>কোনো সেশন নির্বাচিত নেই</p>
          <p>হোম থেকে একটা সেশন বেছে নিন, অথবা নতুন একটা শুরু করুন।</p>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className={styles.canvas} ref={canvasRef}>
        <div className={styles.emptyState}>
          <p>পেজ লোড হচ্ছে…</p>
        </div>
      </div>
    );
  }

  if (renderedPages.length === 0) {
    return (
      <div className={styles.canvas} ref={canvasRef}>
        <div className={styles.emptyState}>
          <p className={styles.emptyStateTitle}>এখনো কোনো পেজ নেই</p>
          <p>শুরু করতে একটা পেজ যোগ করুন —</p>
          <div className={styles.emptyStateActions}>
            <button
              className={styles.emptyStateButton}
              onClick={() => handleCreateFirstPage("bill")}
            >
              + প্রথম বিল
            </button>
            <button
              className={styles.emptyStateButton}
              onClick={() => handleCreateFirstPage("invoice")}
            >
              + প্রথম চালান
            </button>
            <button
              className={styles.emptyStateButton}
              onClick={() => handleCreateFirstPage("summary")}
            >
              + প্রথম সামারি
            </button>
          </div>
        </div>
      </div>
    );
  }

  const packagePickerPage = packagePickerContext
    ? renderedPages.find((p) => p.id === packagePickerContext.pageId)
    : null;
  // For "replace" mode, the line being replaced shouldn't count as "already
  // added" against itself — otherwise its own current package would show
  // dimmed in the picker, which would be confusing when the whole point is
  // to pick something different (or even re-confirm the same one).
  const existingPackageIds = new Set(
    (packagePickerPage?.lineItems ?? [])
      .filter((line) => line.id !== packagePickerContext?.replaceLineId)
      .map((line) => line.packageId)
      .filter(Boolean),
  );

  // Whether ANY Bill page exists in this Set — see this file's top doc
  // comment and domain/aggregation/summaryCalculator.js for the full
  // rationale: as long as one Bill page exists, it is the sole source of
  // truth for package add/edit/delete, and Invoice/Summary's package lists
  // just follow along via useRenderedPages' sync. Bill itself always
  // manages its own packages regardless.
  const hasBillPage = renderedPages.some((p) => p.type === "bill");

  return (
    <div className={styles.canvas} ref={canvasRef}>
      {renderedPages.map((page) => {
        const canManagePackages =
          page.type === "bill"
            ? true
            : page.type === "invoice"
              ? !hasBillPage
              : false;
        return (
          <div
            key={page.id}
            ref={(el) => {
              if (el) pageRefs.current.set(page.id, el);
              else pageRefs.current.delete(page.id);
            }}
          >
            <div className={styles.pageWrapper} style={{ zoom }}>
              {page.type === "bill" ? (
                <BillPage
                  page={page}
                  onFieldChange={(field, value) =>
                    handleFieldChange(page.id, field, value)
                  }
                  onLineChange={(lineId, field, value) =>
                    handleLineChange(page.id, lineId, field, value)
                  }
                  canManagePackages={canManagePackages}
                  onAddAfterLine={(lineId) =>
                    setPackagePickerContext({
                      pageId: page.id,
                      mode: "insertAfter",
                      afterLineId: lineId,
                    })
                  }
                  onEditLine={(lineId) =>
                    setPackagePickerContext({
                      pageId: page.id,
                      mode: "replace",
                      replaceLineId: lineId,
                    })
                  }
                  onDeleteLine={(lineId) =>
                    setDeletingLineItem({ pageId: page.id, lineId })
                  }
                />
              ) : (
                <InvoicePage
                  page={page}
                  onFieldChange={(field, value) =>
                    handleFieldChange(page.id, field, value)
                  }
                  onLineChange={(lineId, field, value) =>
                    handleLineChange(page.id, lineId, field, value)
                  }
                  canManagePackages={canManagePackages}
                  onAddAfterLine={(lineId) =>
                    setPackagePickerContext({
                      pageId: page.id,
                      mode: "insertAfter",
                      afterLineId: lineId,
                    })
                  }
                  onEditLine={(lineId) =>
                    setPackagePickerContext({
                      pageId: page.id,
                      mode: "replace",
                      replaceLineId: lineId,
                    })
                  }
                  onDeleteLine={(lineId) =>
                    setDeletingLineItem({ pageId: page.id, lineId })
                  }
                />
              )}
            </div>

            <PageActionBar
              onAddPage={(type) => handleAddPageAfter(page.id, type)}
              onDelete={() => setDeletingPageId(page.id)}
            />
          </div>
        );
      })}

      {packagePickerContext && (
        <PackagePickerPopup
          onPick={handlePickPackage}
          onClose={() => setPackagePickerContext(null)}
          existingPackageIds={existingPackageIds}
          heading={
            packagePickerContext.mode === "replace"
              ? "প্যাকেজ পরিবর্তন করুন"
              : "প্যাকেজ বেছে নিন"
          }
        />
      )}

      {deletingPageId && (
        <ConfirmDialog
          message="এই পেজটা ডিলিট করতে চান? এটা আর ফেরানো যাবে না।"
          onConfirm={handleConfirmDeletePage}
          onCancel={() => setDeletingPageId(null)}
        />
      )}

      {deletingLineItem && (
        <ConfirmDialog
          message="এই প্যাকেজটা ডিলিট করতে চান? এটা আর ফেরানো যাবে না।"
          onConfirm={handleConfirmDeleteLineItem}
          onCancel={() => setDeletingLineItem(null)}
        />
      )}
    </div>
  );
}
