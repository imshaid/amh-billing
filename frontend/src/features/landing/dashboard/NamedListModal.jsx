import styles from "./NamedListModal.module.css";

/**
 * Shows the full list behind a "Total Buyers"/"Total Addresses" KPI card
 * click (see this project's own decision: clicking these cards opens a
 * popup with the complete list, not just a bare count). Shared by both —
 * same shape (see dashboardCalculator.js's NamedEntry), just a different
 * `title` and data source.
 *
 * @param {{
 *   title: string,
 *   entries: import('../../../domain/aggregation/dashboardCalculator.js').NamedEntry[],
 *   onClose: () => void,
 * }} props
 */
export default function NamedListModal({ title, entries, onClose }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <p className={styles.heading}>{title}</p>
          <button
            type="button"
            className={styles.closeIconButton}
            onClick={onClose}
            aria-label="বন্ধ করুন"
          >
            ×
          </button>
        </div>

        {entries.length === 0 ? (
          <p className={styles.emptyState}>কোনো তথ্য পাওয়া যায়নি।</p>
        ) : (
          <div className={styles.list}>
            {entries.map((entry) => (
              <div key={entry.name} className={styles.row}>
                <span className={styles.name}>{entry.name}</span>
                <span className={styles.meta}>
                  {entry.orderCount} অর্ডার · ৳
                  {entry.totalAmount.toLocaleString("bn-BD")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
