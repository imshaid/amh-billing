import styles from "./TimeRangeSelector.module.css";

const RANGES = [
  { value: "7d", label: "৭ দিন" },
  { value: "30d", label: "৩০ দিন" },
  { value: "6m", label: "৬ মাস" },
  { value: "all", label: "সব সময়" },
];

/**
 * Shared time-range filter for every chart below the stats strip — see
 * this project's own decision. One selection applies to all charts at
 * once rather than each chart having its own, since comparing an income
 * trend and a category breakdown from two different windows would be
 * confusing, not more flexible.
 *
 * @param {{
 *   value: import('../../../domain/aggregation/dashboardCalculator.js').TimeRange,
 *   onChange: (value: string) => void,
 * }} props
 */
export default function TimeRangeSelector({ value, onChange }) {
  return (
    <div className={styles.selector}>
      {RANGES.map((r) => (
        <button
          key={r.value}
          type="button"
          className={`${styles.option} ${value === r.value ? styles.optionActive : ""}`}
          onClick={() => onChange(r.value)}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
