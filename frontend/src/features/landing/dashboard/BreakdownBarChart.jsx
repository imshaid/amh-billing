import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import styles from "./ChartCard.module.css";

/**
 * Horizontal bar chart shared by every "breakdown" report — category,
 * top packages, buyer, ordered-by-person (see dashboardCalculator.js's
 * buildCategoryBreakdown/buildTopPackages/buildBuyerBreakdown/
 * buildOrderedByPersonBreakdown, which all return the same
 * `BreakdownSlice[]` shape for exactly this reason: one chart component,
 * four different data sources).
 *
 * Horizontal (not vertical) bars specifically because labels here are
 * names — buyer names, person names, package names — which are often
 * long enough that vertical bars would need rotated/truncated x-axis
 * labels; horizontal bars give labels their own full-width row instead.
 *
 * Capped to the top `maxItems` slices and fills the parent container's
 * height (`height="100%"`, not a per-slice-count computed height) — see
 * this project's own decision for a single-screen, non-scrollable
 * dashboard on large viewports: every card here has a fixed height set by
 * the CSS grid it lives in (see LandingPage.module.css), so the chart
 * itself must fit that budget rather than grow with the data.
 *
 * @param {{
 *   data: import('../../../domain/aggregation/dashboardCalculator.js').BreakdownSlice[],
 *   maxItems?: number,
 * }} props
 */
export default function BreakdownBarChart({ data, maxItems = 4 }) {
  if (data.length === 0) {
    return <p className={styles.emptyState}>এই সময়ে কোনো তথ্য নেই।</p>;
  }

  const shown = data.slice(0, maxItems);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={shown}
        layout="vertical"
        margin={{ top: 2, right: 20, left: 4, bottom: 2 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--chrome-border)"
          horizontal={false}
        />
        <XAxis
          type="number"
          tick={{ fontSize: 10, fill: "var(--chrome-text-muted)" }}
          tickFormatter={(v) => `৳${v}`}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={90}
          tick={{ fontSize: 10, fill: "var(--chrome-text)" }}
        />
        <Tooltip
          formatter={(value) => [`৳${value.toLocaleString("bn-BD")}`, "মোট"]}
          contentStyle={{ fontSize: "0.75rem", fontFamily: "var(--font-ui)" }}
        />
        <Bar
          dataKey="total"
          fill="var(--chrome-accent)"
          radius={[0, 3, 3, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
