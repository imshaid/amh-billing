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
 * @param {{
 *   data: import('../../../domain/aggregation/dashboardCalculator.js').BreakdownSlice[],
 *   height?: number,
 * }} props
 */
export default function BreakdownBarChart({ data, height }) {
  if (data.length === 0) {
    return <p className={styles.emptyState}>এই সময়ে কোনো তথ্য নেই।</p>;
  }

  // Longer labels need more chart height per bar to stay readable — this
  // scales with the number of slices rather than a fixed height, so a
  // 3-slice chart isn't mostly empty space and an 8-slice one isn't
  // cramped.
  const chartHeight = height ?? Math.max(180, data.length * 42);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--chrome-border)"
          horizontal={false}
        />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "var(--chrome-text-muted)" }}
          tickFormatter={(v) => `৳${v}`}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={120}
          tick={{ fontSize: 11, fill: "var(--chrome-text)" }}
        />
        <Tooltip
          formatter={(value) => [`৳${value.toLocaleString("bn-BD")}`, "মোট"]}
          contentStyle={{ fontSize: "0.8rem", fontFamily: "var(--font-ui)" }}
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
