import styles from "./KpiCard.module.css";

/**
 * One compact KPI card — label, big number, and a small trend indicator
 * (▲/▼ + percent vs the previous comparable period). This is the pattern
 * every reference hotel/admin dashboard uses (see this project's own
 * research into real dashboard UI conventions) — a bare number with no
 * comparison tells the person "what" but not "is this good or bad",
 * which the trend arrow answers at a glance.
 *
 * `trendPct: null` (see dashboardCalculator.js's computeTrendPct) renders
 * as a plain "—" rather than a misleading arrow — this happens when the
 * previous period had zero sales, so any percent change is undefined,
 * not actually zero or infinite.
 *
 * @param {{
 *   label: string,
 *   value: string,
 *   trendPct: number|null,
 *   trendLabel: string,
 * }} props
 */
export default function KpiCard({ label, value, trendPct, trendLabel }) {
  const isUp = trendPct != null && trendPct > 0;
  const isDown = trendPct != null && trendPct < 0;

  return (
    <div className={styles.card}>
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>{value}</p>
      <p
        className={`${styles.trend} ${isUp ? styles.trendUp : ""} ${isDown ? styles.trendDown : ""}`}
      >
        {trendPct == null ? (
          "—"
        ) : (
          <>
            {isUp ? "▲" : isDown ? "▼" : "＝"} {Math.abs(trendPct).toFixed(1)}%
          </>
        )}
        <span className={styles.trendLabel}> {trendLabel}</span>
      </p>
    </div>
  );
}
