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
import ScopeConfirmDialog from "../../features/shared/ScopeConfirmDialog.jsx";
import PageActionBar from "./PageActionBar.jsx";
import styles from "./CanvasArea.module.css";

/** Fields where a "apply to all pages too?" prompt makes sense — these are
 * the ones commonly identical across an entire Set (same buyer, same
 * address). Date and serialOrLogCode are excluded on purpose: those
 * legitimately differ per page and should never trigger this prompt. */
const SCOPE_PROMPTABLE_FIELDS = new Set(["buyerName", "address"]);

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
 * doc comment) and its lineItems are always derived at render time from the
 * Set's Invoice/Bill pages, never copied — so "+ নতুন সামারি" goes through
 * `addSummaryPage` instead. There is deliberately no "duplicate" button
 * separate from these — the Bill/Invoice add buttons already are the
 * duplicate action.
 *
 * Inline edits write straight to IndexedDB via `updateDraftPage` — this is
 * safe because, per the History Edit Policy in docs/data-model.md, a page
 * only needs `revisePage` once it has actually been generated/exported as a
 * PDF; since PDF export isn't built yet, every page in this app is still a
 * draft. `refreshPages` is called after each write so the shared `pages`
 * state (and therefore live totals every other page depends on, e.g.
 * Summary) updates immediately.
 *
 * Packages have exactly two entry points per row, both always visible —
 * see BillPage/InvoicePage's own doc comments for the full rationale:
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
 * @param {{
 *   activeSetId: string|null,
 *   pages: import('../../domain/models/Page.js').Page[]|null,
 *   status: "idle"|"loading"|"ready"|"error",
 *   refreshPages: () => Promise<void>,
 *   zoom: number,
 *   registerScrollApi: (api: { scrollToPage: (pageId: string) => void }) => void,
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
  // Holds a change that just committed on one page and might also apply to
  // every other page in the Set, awaiting the user's scope choice (see
  // ScopeConfirmDialog). Shape depends on `kind`:
  //   { kind: "field", pageId, field, value }
  //   { kind: "package", pageId, pkg, lineItemId }
  const [pendingScopeChange, setPendingScopeChange] = useState(null);

  if (registerScrollApi) {
    registerScrollApi({
      scrollToPage: (pageId) => {
        pageRefs.current
          .get(pageId)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      },
    });
  }

  async function handleFieldChange(pageId, field, value) {
    await updateDraftPage(pageId, { [field]: value });
    await refreshPages();
    if (SCOPE_PROMPTABLE_FIELDS.has(field) && renderedPages.length > 1) {
      setPendingScopeChange({ kind: "field", pageId, field, value });
    }
  }

  async function handleApplyScopeToAll() {
    if (!pendingScopeChange) return;
    const { kind, pageId, field, value, pkg } = pendingScopeChange;
    const otherPages = renderedPages.filter((p) => p.id !== pageId);

    if (kind === "field") {
      await Promise.all(
        otherPages.map((p) => updateDraftPage(p.id, { [field]: value })),
      );
    } else if (kind === "package") {
      // Skip any page that already has this exact package — same duplicate
      // prevention rule as the picker itself (see PackagePickerPopup).
      await Promise.all(
        otherPages
          .filter((p) => !p.lineItems.some((line) => line.packageId === pkg.id))
          .map((p) => {
            const nextSl = p.lineItems.length + 1;
            const newLine = createLineItemFromPackage(pkg, { sl: nextSl });
            return updateDraftPage(p.id, {
              lineItems: [...p.lineItems, newLine],
            });
          }),
      );
    }

    await refreshPages();
    setPendingScopeChange(null);
  }

  async function handleLineChange(pageId, lineId, field, value) {
    // For a Summary page, `lineItems` in raw storage may not yet contain
    // this line at all — recomputeSummaryLines (see useRenderedPages) only
    // materializes Summary lineItems at render time; nothing is written
    // back to IndexedDB until an override actually happens. So the line
    // being edited must be looked up in `renderedPages` (the aggregated
    // view), not `pages` (raw storage), or the edit silently finds nothing
    // to match and is lost. For Bill/Invoice pages the two are equivalent
    // for lineItems (only bill totals differ), so this is safe for every
    // page type, not just Summary.
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
    if (mode !== "replace" && renderedPages.length > 1) {
      setPendingScopeChange({ kind: "package", pageId, pkg });
    }
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
    // over, and its lineItems are always derived at render time (see
    // recomputeSummaryLines / useRenderedPages), never copied. See
    // createSummaryPage's doc comment for why this needs its own path
    // instead of duplicatePageAsNew.
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
      <div className={styles.canvas}>
        <div className={styles.emptyState}>
          <p className={styles.emptyStateTitle}>কোনো সেশন নির্বাচিত নেই</p>
          <p>হোম থেকে একটা সেশন বেছে নিন, অথবা নতুন একটা শুরু করুন।</p>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className={styles.canvas}>
        <div className={styles.emptyState}>
          <p>পেজ লোড হচ্ছে…</p>
        </div>
      </div>
    );
  }

  if (renderedPages.length === 0) {
    return (
      <div className={styles.canvas}>
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

  return (
    <div className={styles.canvas}>
      {renderedPages.map((page) => (
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
      ))}

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

      {pendingScopeChange && (
        <ScopeConfirmDialog
          message={
            pendingScopeChange.kind === "package"
              ? `"${pendingScopeChange.pkg.name}" প্যাকেজটা কি সেশনের বাকি পেজগুলোতেও যোগ করতে চান?`
              : "এই তথ্য কি সেশনের বাকি পেজগুলোতেও আপডেট করতে চান?"
          }
          onApplyToAll={handleApplyScopeToAll}
          onApplyToThisOnly={() => setPendingScopeChange(null)}
        />
      )}
    </div>
  );
}
