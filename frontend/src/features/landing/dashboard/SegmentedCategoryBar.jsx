import styles from "./SegmentedCategoryBar.module.css";

/** Blue-shade palette, per this project's own decision: the app's brand
 * blue in a sequence of opacities/shades (Lodgify-style single-accent),
 * not a rainbow of unrelated colors. */
const SHADES = [
  "var(--dash-blue)",
  "#4f83e0",
  "#7ea6ea",
  "#aec8f2",
  "#d6e3f8",
  "#94a3b8",
];

/**
 * Categories widget — a horizontal segmented bar (each category gets a
 * proportional-width, distinctly-shaded block) with small cards below
 * showing each category's value, matching the wireframe's own sketch
 * (see this project's own decision — a segmented bar + card list, not a
 * donut, for this specific widget).
 *
 * @param {{
 *   data: import('../../../domain/aggregation/dashboardCalculator.js').BreakdownSlice[],
 * }} props
 */
export default function SegmentedCategoryBar({ data }) {
  const total = data.reduce((sum, d) => sum + d.total, 0);

  if (data.length === 0) {
    return <p className={styles.emptyState}>এই সময়ে কোনো তথ্য নেই।</p>;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.bar}>
        {data.map((slice, i) => (
          <div
            key={slice.label}
            className={styles.segment}
            style={{
              flexGrow: total > 0 ? slice.total : 1,
              background: SHADES[i % SHADES.length],
            }}
            title={`${slice.label}: ৳${slice.total.toLocaleString("bn-BD")}`}
          />
        ))}
      </div>

      <div className={styles.cardGrid}>
        {data.slice(0, 4).map((slice, i) => (
          <div key={slice.label} className={styles.categoryCard}>
            <span
              className={styles.categoryDot}
              style={{ background: SHADES[i % SHADES.length] }}
            />
            <div className={styles.categoryInfo}>
              <p className={styles.categoryName}>{slice.label}</p>
              <p className={styles.categoryValue}>
                ৳{slice.total.toLocaleString("bn-BD")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
