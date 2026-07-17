import { useAppState } from "../../state/useAppState.js";
import { addPage, revisePage } from "../../db/pages.repository.js";
import { resyncSetPageOrder } from "../../db/sets.repository.js";
import styles from "./ActionsTab.module.css";

/** Bangla display labels for Page.type, which is stored in IndexedDB as
 * "bill"|"invoice"|"summary" per docs/data-model.md — only the label shown
 * here changes, the stored value is untouched (same pattern as
 * usePackages.js's CATEGORY_LABELS). */
const PAGE_TYPE_LABELS = {
  bill: "বিল",
  invoice: "চালান",
  summary: "সামারি",
};

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
 * (see backend/, currently empty) doesn't exist. The "এক্সপোর্ট" button is a
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
export default function ActionsTab({
  activeSetId,
  activePageId,
  pages,
  refreshPages,
}) {
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
        <p className={styles.emptyState}>
          আগে একটা সেশন বেছে নিন বা তৈরি করুন।
        </p>
      </div>
    );
  }

  return (
    <div className={styles.tab}>
      <div className={styles.section}>
        <p className={styles.sectionLabel}>পেজ যোগ করুন</p>
        <div className={styles.buttonRow}>
          <button
            className={styles.actionButton}
            onClick={() => handleAddPage("bill")}
          >
            + বিল
          </button>
          <button
            className={styles.actionButton}
            onClick={() => handleAddPage("invoice")}
          >
            + চালান
          </button>
          <button
            className={styles.actionButton}
            onClick={() => handleAddPage("summary")}
          >
            + সামারি
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <p className={styles.sectionLabel}>এই সেশনের পেজসমূহ</p>
        {!pages || pages.length === 0 ? (
          <p className={styles.emptyState}>
            এখনো কোনো পেজ নেই — উপর থেকে একটা যোগ করুন।
          </p>
        ) : (
          <ul className={styles.pageList}>
            {pages.map((page) => (
              <li
                key={page.id}
                className={`${styles.pageRow} ${
                  page.id === activePageId ? styles.pageRowActive : ""
                }`}
                onClick={() =>
                  dispatch({ type: "SET_ACTIVE_PAGE", payload: page.id })
                }
              >
                <span className={styles.pageRowType}>
                  {PAGE_TYPE_LABELS[page.type] ?? page.type} —{" "}
                  {page.serialOrLogCode || page.buyerName || "শিরোনামহীন"}
                </span>
                <span className={styles.pageRowMeta}>
                  {page.date || "তারিখ নেই"}
                  <button
                    className={`${styles.actionButton} ${styles.duplicateButton}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicatePage(page.id);
                    }}
                    title="নতুন রিভিশন হিসেবে ডুপ্লিকেট করুন (মূল পেজ অপরিবর্তিত থাকবে)"
                  >
                    ডুপ্লিকেট
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.section}>
        <p className={styles.sectionLabel}>এক্সপোর্ট</p>
        <button
          className={styles.actionButton}
          disabled
          title="PDF এক্সপোর্ট সার্ভিস এখনো তৈরি হয়নি"
        >
          PDF এক্সপোর্ট (শীঘ্রই আসছে)
        </button>
      </div>
    </div>
  );
}
