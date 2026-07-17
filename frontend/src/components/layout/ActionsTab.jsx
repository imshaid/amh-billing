import { useAppState } from "../../state/useAppState.js";
import { addPage, revisePage } from "../../db/pages.repository.js";
import { resyncSetPageOrder } from "../../db/sets.repository.js";
import styles from "./ActionsTab.module.css";

/**
 * Session-level actions: add a new Bill/Invoice/Summary page to the active
 * Set, pick which existing page is active, and duplicate-as-revision an
 * existing page per the History Edit Policy (docs/data-model.md — never
 * mutate a page that's already been generated/shared; this always creates a
 * new row via `revisePage`, regardless of whether the original was actually
 * ever exported, since this MVP doesn't yet track an "exported" flag to
 * gate that distinction more precisely).
 *
 * PDF export itself isn't wired up yet — the backend Puppeteer service
 * (see backend/, currently empty) doesn't exist. The "Export" button is a
 * visible placeholder so the tab's shape doesn't need to change again once
 * export ships; it's disabled until then.
 *
 * @param {{
 *   activeSetId: string|null,
 *   activePageId: string|null,
 *   pages: import('../../domain/models/Page.js').Page[]|null,
 *   refreshPages: () => Promise<void>,
 * }} props
 */
export default function ActionsTab({ activeSetId, activePageId, pages, refreshPages }) {
  const { dispatch } = useAppState();

  async function handleAddPage(type) {
    if (!activeSetId) return;
    const page = await addPage({ setId: activeSetId, type });
    await resyncSetPageOrder(activeSetId);
    await refreshPages();
    dispatch({ type: "SET_ACTIVE_PAGE", payload: page.id });
  }

  async function handleDuplicatePage(pageId) {
    const revision = await revisePage(pageId, {});
    await resyncSetPageOrder(activeSetId);
    await refreshPages();
    dispatch({ type: "SET_ACTIVE_PAGE", payload: revision.id });
  }

  if (!activeSetId) {
    return (
      <div className={styles.tab}>
        <p className={styles.emptyState}>Select or create a session first.</p>
      </div>
    );
  }

  return (
    <div className={styles.tab}>
      <div className={styles.section}>
        <p className={styles.sectionLabel}>Add page</p>
        <div className={styles.buttonRow}>
          <button className={styles.actionButton} onClick={() => handleAddPage("bill")}>
            + Bill
          </button>
          <button className={styles.actionButton} onClick={() => handleAddPage("invoice")}>
            + Invoice
          </button>
          <button className={styles.actionButton} onClick={() => handleAddPage("summary")}>
            + Summary
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <p className={styles.sectionLabel}>Pages in this session</p>
        {!pages || pages.length === 0 ? (
          <p className={styles.emptyState}>No pages yet — add one above.</p>
        ) : (
          <ul className={styles.pageList}>
            {pages.map((page) => (
              <li
                key={page.id}
                className={`${styles.pageRow} ${
                  page.id === activePageId ? styles.pageRowActive : ""
                }`}
                onClick={() => dispatch({ type: "SET_ACTIVE_PAGE", payload: page.id })}
              >
                <span className={styles.pageRowType}>
                  {page.type} — {page.serialOrLogCode || page.buyerName || "untitled"}
                </span>
                <span className={styles.pageRowMeta}>
                  {page.date || "no date"}
                  <button
                    className={`${styles.actionButton} ${styles.duplicateButton}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicatePage(page.id);
                    }}
                    title="Duplicate as a new revision (original stays unchanged)"
                  >
                    Duplicate
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.section}>
        <p className={styles.sectionLabel}>Export</p>
        <button className={styles.actionButton} disabled title="PDF export service not built yet">
          Export PDF (coming soon)
        </button>
      </div>
    </div>
  );
}
