import { useActivePage } from "../../hooks/useActivePage.js";
import BillPage from "../../features/bill/BillPage.jsx";
import InvoicePage from "../../features/invoice/InvoicePage.jsx";
import styles from "./CanvasArea.module.css";

/**
 * Renders whichever Page is currently active as a live preview — this is the
 * WYSIWYG surface referenced in the project notes ("preview-ই আসল output").
 * Bill and Invoice share the same rendering component that the PDF service
 * will eventually use (see BillPage.jsx's own doc comment); a Summary page
 * reuses InvoicePage too, since docs/data-model.md defines Summary as
 * "mechanically a normal Invoice page" — the only difference is that
 * useActivePage has already substituted in the live-aggregated lineItems
 * before this component ever sees it.
 *
 * `pages`/`status` come from AppShell's single shared `usePages` call (see
 * the comment there) rather than this component calling the hook itself —
 * that's what lets a write from BottomPanel's PackagesTab show up here
 * without a manual refresh prop drilled sideways between siblings.
 *
 * @param {{
 *   activeSetId: string|null,
 *   activePageId: string|null,
 *   pages: import('../../domain/models/Page.js').Page[]|null,
 *   status: "idle"|"loading"|"ready"|"error",
 * }} props
 */
export default function CanvasArea({ activeSetId, activePageId, pages, status }) {
  const activePage = useActivePage(pages, activePageId);

  if (!activeSetId) {
    return (
      <div className={styles.canvas}>
        <div className={styles.emptyState}>
          <p className={styles.emptyStateTitle}>No session selected</p>
          <p>Pick a session from the sidebar, or start a new one.</p>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className={styles.canvas}>
        <div className={styles.emptyState}>
          <p>Loading pages…</p>
        </div>
      </div>
    );
  }

  if (!activePage) {
    return (
      <div className={styles.canvas}>
        <div className={styles.emptyState}>
          <p className={styles.emptyStateTitle}>No page selected</p>
          <p>Add a Bill, Invoice, or Summary page to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.canvas}>
      <div className={styles.pageWrapper}>
        {activePage.type === "bill" ? (
          <BillPage page={activePage} />
        ) : (
          <InvoicePage page={activePage} />
        )}
      </div>
    </div>
  );
}
