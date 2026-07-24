import DateField from "../../shared/DateField.jsx";
import styles from "./DailyOrderDetail.module.css";

/** @param {string} isoDate "YYYY-MM-DD" */
function shiftDate(isoDate, deltaDays) {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + deltaDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Date-navigable "what got ordered on this day" view — see this
 * project's own decision and dashboardCalculator.js's buildDailyOrderDetail.
 * Reuses the app's existing DateField (calendar popup) rather than a new
 * date picker, plus ←/→ arrow buttons for quick day-by-day browsing
 * without opening the calendar each time.
 *
 * @param {{
 *   selectedDate: string,
 *   onDateChange: (isoDate: string) => void,
 *   lines: import('../../../domain/aggregation/dashboardCalculator.js').DailyOrderLine[],
 * }} props
 */
export default function DailyOrderDetail({
  selectedDate,
  onDateChange,
  lines,
}) {
  const totalAmount = lines.reduce((sum, l) => sum + l.amount, 0);

  return (
    <div className={styles.card}>
      <div className={styles.headerRow}>
        <p className={styles.title}>দৈনিক অর্ডার বিবরণ</p>
        <div className={styles.dateNav}>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => onDateChange(shiftDate(selectedDate, -1))}
            aria-label="আগের দিন"
          >
            ‹
          </button>
          <DateField value={selectedDate} onChange={onDateChange} />
          <button
            type="button"
            className={styles.navButton}
            onClick={() => onDateChange(shiftDate(selectedDate, 1))}
            aria-label="পরের দিন"
          >
            ›
          </button>
        </div>
      </div>

      {lines.length === 0 ? (
        <p className={styles.emptyState}>এই দিনে কোনো অর্ডার নেই।</p>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>প্যাকেজ</th>
                  <th>পরিমাণ</th>
                  <th>রেট</th>
                  <th>মোট</th>
                  <th>ক্রেতা</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i}>
                    <td>{line.packageName}</td>
                    <td>{line.quantity}</td>
                    <td>{line.rate != null ? `৳${line.rate}` : "—"}</td>
                    <td>৳{line.amount.toLocaleString("bn-BD")}</td>
                    <td className={styles.buyerCell}>{line.buyerName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={styles.totalLine}>
            মোট: ৳{totalAmount.toLocaleString("bn-BD")}
          </p>
        </>
      )}
    </div>
  );
}
