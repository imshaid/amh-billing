import styles from "./RecentSessions.module.css";

/** @param {string} isoDate */
function formatDate(isoDate) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Last 5 sessions, most recently updated first — a shortcut so recent
 * work is visible without leaving the dashboard for "আগের সেশনসমূহ" (see
 * this project's own decision). Clicking a row opens that session
 * directly, same as clicking a card on PreviousSessionsScreen.
 *
 * @param {{
 *   rows: import('../../../domain/aggregation/dashboardCalculator.js').DashboardRow[],
 *   onOpenSession: (setId: string) => void,
 * }} props
 */
export default function RecentSessions({ rows, onOpenSession }) {
  const recent = [...rows]
    .sort((a, b) => b.set.updatedAt.localeCompare(a.set.updatedAt))
    .slice(0, 5);

  return (
    <div className={styles.card}>
      <p className={styles.title}>সাম্প্রতিক সেশন</p>
      {recent.length === 0 ? (
        <p className={styles.emptyState}>এখনো কোনো সেশন নেই।</p>
      ) : (
        <div className={styles.list}>
          {recent.map((row) => (
            <button
              key={row.set.id}
              type="button"
              className={styles.row}
              onClick={() => onOpenSession(row.set.id)}
            >
              <span className={styles.rowName}>{row.set.name}</span>
              <span className={styles.rowMeta}>
                {formatDate(row.displayDate)} · ৳
                {row.total.toLocaleString("bn-BD")}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
