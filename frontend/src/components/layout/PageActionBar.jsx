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
 * `disableBill`, when true, disables (not hides) the "+ নতুন বিল" button —
 * per the design decision that a Set should have exactly one Bill page
 * (see docs/data-model.md), once one already exists in the Set every
 * PageActionBar's Bill button is disabled rather than removed, so the
 * button's presence still communicates "this is one of the three page
 * types this app has," just not currently clickable. A title tooltip
 * explains why.
 *
 * @param {{
 *   onAddPage: (type: "bill"|"invoice"|"summary") => void,
 *   onDelete: () => void,
 *   disableBill?: boolean,
 * }} props
 */
export default function PageActionBar({
  onAddPage,
  onDelete,
  disableBill = false,
}) {
  return (
    <div className={styles.bar}>
      {TYPE_ORDER.map((type) => {
        const isBillDisabled = type === "bill" && disableBill;
        return (
          <button
            key={type}
            type="button"
            className={styles.addButton}
            onClick={() => onAddPage(type)}
            disabled={isBillDisabled}
            title={
              isBillDisabled
                ? "এই সেশনে ইতিমধ্যে একটা বিল পেজ আছে — একটা সেশনে একটাই বিল পেজ রাখা যায়"
                : undefined
            }
          >
            + নতুন {TYPE_LABELS[type]}
          </button>
        );
      })}
      <button type="button" className={styles.deleteButton} onClick={onDelete}>
        ডিলিট
      </button>
    </div>
  );
}
