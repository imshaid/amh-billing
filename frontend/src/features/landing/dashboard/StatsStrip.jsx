import styles from "./StatsStrip.module.css";

/**
 * Three at-a-glance numbers across the top of the dashboard — see this
 * project's own decision. Always "today"/"this month"/"all-time session
 * count" regardless of whatever time-range the charts below are
 * currently showing (see dashboardCalculator.js's computeStats doc
 * comment on why these two are kept independent).
 *
 * @param {{
 *   todaySales: number,
 *   monthSales: number,
 *   totalSessions: number,
 * }} props
 */
export default function StatsStrip({ todaySales, monthSales, totalSessions }) {
  return (
    <div className={styles.strip}>
      <div className={styles.card}>
        <p className={styles.label}>আজকের বিক্রয়</p>
        <p className={styles.value}>৳{todaySales.toLocaleString("bn-BD")}</p>
      </div>
      <div className={styles.card}>
        <p className={styles.label}>এই মাসের আয়</p>
        <p className={styles.value}>৳{monthSales.toLocaleString("bn-BD")}</p>
      </div>
      <div className={styles.card}>
        <p className={styles.label}>মোট সেশন</p>
        <p className={styles.value}>{totalSessions.toLocaleString("bn-BD")}</p>
      </div>
    </div>
  );
}
