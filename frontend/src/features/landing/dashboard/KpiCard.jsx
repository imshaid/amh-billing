import styles from "./KpiCard.module.css";

/**
 * One KPI card — colored icon chip, big number, and a trend pill badge
 * (colored background, not just colored text — see the reference
 * dashboard screenshots this project's own decision was based on: Hostay/
 * PMS-style cards use a filled green/red pill for the trend, not a bare
 * arrow+percent in plain text). Each `color` gets its own icon-chip and
 * accent, using the dashboard-only palette (see tokens.css's
 * --dash-*) — never the workspace editor's neutral --chrome-accent.
 *
 * `trendPct: null` (see dashboardCalculator.js's computeTrendPct) renders
 * as a neutral gray "—" pill — this happens when the previous period had
 * zero sales, so any percent change is undefined, not actually zero.
 *
 * @param {{
 *   icon: string,
 *   label: string,
 *   value: string,
 *   trendPct: number|null,
 *   trendLabel: string,
 *   color: "blue"|"teal"|"orange"|"purple",
 * }} props
 */
export default function KpiCard({
  icon,
  label,
  value,
  trendPct,
  trendLabel,
  color,
}) {
  const isUp = trendPct != null && trendPct > 0;
  const isDown = trendPct != null && trendPct < 0;
  const trendClass = isUp
    ? styles.trendUp
    : isDown
      ? styles.trendDown
      : styles.trendFlat;

  return (
    <div className={styles.card}>
      <div className={`${styles.iconChip} ${styles[`chip_${color}`]}`}>
        <span aria-hidden="true">{icon}</span>
      </div>
      <div className={styles.body}>
        <p className={styles.label}>{label}</p>
        <div className={styles.valueRow}>
          <p className={styles.value}>{value}</p>
          <span className={`${styles.trendPill} ${trendClass}`}>
            {trendPct == null
              ? "—"
              : `${isUp ? "▲" : isDown ? "▼" : "＝"} ${Math.abs(trendPct).toFixed(1)}%`}
          </span>
        </div>
        <p className={styles.trendLabel}>{trendLabel}</p>
      </div>
    </div>
  );
}
