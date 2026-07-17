import styles from "./PageActionBar.module.css";

const TYPE_LABELS = { bill: "বিল", invoice: "চালান", summary: "সামারি" };
const TYPE_ORDER = ["bill", "invoice", "summary"];

/**
 * Per-page toolbar shown below every rendered page — "+ নতুন বিল/চালান/
 * সামারি" and "ডিলিট". Replaces the earlier top-bar-only add flow: adding a
 * page is now always anchored to a specific page (whichever one this bar
 * belongs to), which is what makes "the new page copies THIS page's data"
 * unambiguous (see duplicatePageAsNew / addDuplicatedPage).
 *
 * All three add buttons are always shown, regardless of this page's own
 * type — clicking "+ নতুন চালান" under a Bill page still works and still
 * copies the Bill's buyerName/address/date/lineItems into a fresh Invoice.
 *
 * @param {{
 *   onAddPage: (type: "bill"|"invoice"|"summary") => void,
 *   onDelete: () => void,
 * }} props
 */
export default function PageActionBar({ onAddPage, onDelete }) {
  return (
    <div className={styles.bar}>
      {TYPE_ORDER.map((type) => (
        <button
          key={type}
          type="button"
          className={styles.addButton}
          onClick={() => onAddPage(type)}
        >
          + নতুন {TYPE_LABELS[type]}
        </button>
      ))}
      <button type="button" className={styles.deleteButton} onClick={onDelete}>
        ডিলিট
      </button>
    </div>
  );
}
