import { useRef, useState } from "react";
import { useRenderedPages } from "../../hooks/useRenderedPages.js";
import { updateDraftPage } from "../../db/pages.repository.js";
import { createLineItemFromPackage } from "../../domain/models/Page.js";
import BillPage from "../../features/bill/BillPage.jsx";
import InvoicePage from "../../features/invoice/InvoicePage.jsx";
import PackagePickerPopup from "../../features/package-picker/PackagePickerPopup.jsx";
import styles from "./CanvasArea.module.css";

/**
 * Renders every Page in the active Set as one continuous scrollable canvas
 * (Chrome-PDF-viewer style, per the workspace redesign) rather than showing
 * only the active page behind tabs. `useRenderedPages` applies the same
 * live recomputation (summary aggregation, bill totals) useActivePage used
 * to apply to a single page, to all of them at once.
 *
 * Each page's DOM node is kept in `pageRefs` so PageCountNav's dropdown can
 * scroll a specific page into view (see `scrollToPage`, exposed via the
 * `onRegisterScrollTarget` ref callback passed up to WorkspaceView).
 *
 * Inline edits write straight to IndexedDB via `updateDraftPage` — this is
 * safe because, per the History Edit Policy in docs/data-model.md, a page
 * only needs `revisePage` once it has actually been generated/exported as a
 * PDF; since PDF export isn't built yet, every page in this app is still a
 * draft, so direct mutation is the correct path for now. `refreshPages` is
 * called after each write so the shared `pages` state (and therefore the
 * live totals every other page depends on, e.g. Summary) updates immediately.
 *
 * The package-picker popup is owned here (not inside BillPage/InvoicePage)
 * because it needs to know which page triggered it (`addingToPageId`) and
 * hands the result back to that exact page's line items.
 *
 * @param {{
 *   activeSetId: string|null,
 *   pages: import('../../domain/models/Page.js').Page[]|null,
 *   status: "idle"|"loading"|"ready"|"error",
 *   refreshPages: () => Promise<void>,
 *   registerScrollApi: (api: { scrollToPage: (pageId: string) => void }) => void,
 * }} props
 */
export default function CanvasArea({
  activeSetId,
  pages,
  status,
  refreshPages,
  registerScrollApi,
}) {
  const renderedPages = useRenderedPages(pages);
  const pageRefs = useRef(new Map());
  const [addingToPageId, setAddingToPageId] = useState(null);

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
  }

  async function handleLineChange(pageId, lineId, field, value) {
    const page = pages?.find((p) => p.id === pageId);
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

  async function handlePickPackage(pkg) {
    const page = pages?.find((p) => p.id === addingToPageId);
    if (!page) return;
    const nextSl = page.lineItems.length + 1;
    const newLine = createLineItemFromPackage(pkg, { sl: nextSl });
    await updateDraftPage(page.id, { lineItems: [...page.lineItems, newLine] });
    await refreshPages();
    setAddingToPageId(null);
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
          <p>উপরের বিল/চালান/সামারি বাটন থেকে একটা পেজ যোগ করুন।</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.canvas}>
      {renderedPages.map((page) => (
        <div
          key={page.id}
          className={styles.pageWrapper}
          ref={(el) => {
            if (el) pageRefs.current.set(page.id, el);
            else pageRefs.current.delete(page.id);
          }}
        >
          {page.type === "bill" ? (
            <BillPage
              page={page}
              onFieldChange={(field, value) =>
                handleFieldChange(page.id, field, value)
              }
              onLineChange={(lineId, field, value) =>
                handleLineChange(page.id, lineId, field, value)
              }
              onAddRow={() => setAddingToPageId(page.id)}
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
              onAddRow={() => setAddingToPageId(page.id)}
            />
          )}
        </div>
      ))}

      {addingToPageId && (
        <PackagePickerPopup
          onPick={handlePickPackage}
          onClose={() => setAddingToPageId(null)}
        />
      )}
    </div>
  );
}
