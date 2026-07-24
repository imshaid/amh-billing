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
 * Income over time — bars, not a line, since the underlying data is
 * discrete per-day/per-month totals rather than a continuously sampled
 * quantity; a bar chart doesn't visually imply interpolation between
 * points the way a line does.
 *
 * @param {{
 *   data: import('../../../domain/aggregation/dashboardCalculator.js').IncomePoint[],
 * }} props
 */
export default function IncomeTrendChart({ data }) {
  if (data.length === 0) {
    return <p className={styles.emptyState}>এই সময়ে কোনো তথ্য নেই।</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chrome-border)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "var(--chrome-text-muted)" }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--chrome-text-muted)" }}
          tickFormatter={(v) => `৳${v}`}
        />
        <Tooltip
          formatter={(value) => [`৳${value.toLocaleString("bn-BD")}`, "আয়"]}
          contentStyle={{ fontSize: "0.8rem", fontFamily: "var(--font-ui)" }}
        />
        <Bar
          dataKey="total"
          fill="var(--chrome-accent)"
          radius={[3, 3, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
