import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import styles from "./ChartCard.module.css";

/**
 * Income over time — a filled area chart with a gradient, matching the
 * reference dashboard's "Revenue" widget look (see this project's own
 * decision after reference research) rather than a flat bar chart. The
 * gradient fade communicates magnitude/trend at a glance the way plain
 * bars don't, and is the standard premium-dashboard treatment for a
 * time-series income metric.
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
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--dash-blue)" stopOpacity={0.35} />
            <stop
              offset="100%"
              stopColor="var(--dash-blue)"
              stopOpacity={0.02}
            />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chrome-border)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "var(--chrome-text-muted)" }}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--chrome-text-muted)" }}
          tickFormatter={(v) => `৳${v}`}
          width={48}
        />
        <Tooltip
          formatter={(value) => [`৳${value.toLocaleString("bn-BD")}`, "আয়"]}
          contentStyle={{ fontSize: "0.75rem", fontFamily: "var(--font-ui)" }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="var(--dash-blue)"
          strokeWidth={2.5}
          fill="url(#incomeFill)"
          dot={{ r: 3, fill: "var(--dash-blue)", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
