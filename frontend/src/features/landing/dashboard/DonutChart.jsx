import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import styles from "./DonutChart.module.css";

/** Multi-color palette — see this project's own decision and tokens.css's
 * --dash-* tokens: a real dashboard distinguishes categories by color, not
 * by shade-of-one-hue. Cycles through the full dashboard accent set. */
const COLORS = [
  "var(--dash-blue)",
  "var(--dash-orange)",
  "var(--dash-teal)",
  "var(--dash-purple)",
  "#f59e0b",
  "#ec4899",
  "#64748b",
];

/**
 * Donut chart with the total centered inside the ring — the pattern every
 * reference hotel/admin dashboard uses for composition data (occupancy,
 * ratings breakdown, reservation types — see this project's own research).
 * Used here for category-wise sales breakdown, in place of the horizontal
 * bar chart this dashboard originally shipped with — a donut reads
 * "proportion of a whole" more immediately than a bar chart does, which
 * is exactly what category share of total sales is.
 *
 * @param {{
 *   data: import('../../../domain/aggregation/dashboardCalculator.js').BreakdownSlice[],
 *   centerLabel?: string,
 * }} props
 */
export default function DonutChart({ data, centerLabel = "মোট" }) {
  const total = data.reduce((sum, d) => sum + d.total, 0);

  if (data.length === 0) {
    return <p className={styles.emptyState}>এই সময়ে কোনো তথ্য নেই।</p>;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.ringArea}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="label"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                `৳${value.toLocaleString("bn-BD")}`,
                name,
              ]}
              contentStyle={{
                fontSize: "0.75rem",
                fontFamily: "var(--font-ui)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className={styles.centerOverlay}>
          <p className={styles.centerValue}>৳{total.toLocaleString("bn-BD")}</p>
          <p className={styles.centerLabel}>{centerLabel}</p>
        </div>
      </div>

      <div className={styles.legend}>
        {data.slice(0, 5).map((slice, i) => (
          <div key={slice.label} className={styles.legendItem}>
            <span
              className={styles.legendDot}
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span className={styles.legendLabel}>{slice.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
