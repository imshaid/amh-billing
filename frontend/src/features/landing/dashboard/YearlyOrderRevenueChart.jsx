import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import styles from "./ChartCard.module.css";

/**
 * Yearly Order and Revenue — two lines (order count on the left axis,
 * revenue in ৳ on the right axis) across all 12 months of one calendar
 * year (see dashboardCalculator.js's buildYearlyOrderRevenueTrend, which
 * always returns exactly 12 points, Jan-Dec, even for empty months).
 *
 * Uses `ComposedChart` (not a plain `LineChart`) specifically to support
 * two independent Y axes — order count and revenue are wildly different
 * scales (tens vs thousands), so plotting them on one shared axis would
 * flatten whichever metric has the smaller range into an unreadable
 * straight line.
 *
 * `compact`: renders as a bare sparkline — no axes, grid, legend, or
 * tooltip, just the revenue line — for use as the wireframe's "Monthly
 * Revenue (with mini graph)" widget inside the combined Monthly
 * Order/Revenue card (see LandingPage.jsx), which needs a small trend
 * indicator, not a full standalone chart.
 *
 * @param {{
 *   data: import('../../../domain/aggregation/dashboardCalculator.js').YearlyPoint[],
 *   compact?: boolean,
 * }} props
 */
export default function YearlyOrderRevenueChart({ data, compact = false }) {
  if (compact) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
        >
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="var(--dash-blue)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={data}
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chrome-border)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "var(--chrome-text-muted)" }}
        />
        <YAxis
          yAxisId="orders"
          tick={{ fontSize: 10, fill: "var(--chrome-text-muted)" }}
          width={28}
        />
        <YAxis
          yAxisId="revenue"
          orientation="right"
          tick={{ fontSize: 10, fill: "var(--chrome-text-muted)" }}
          tickFormatter={(v) => `৳${v}`}
          width={52}
        />
        <Tooltip
          formatter={(value, name) =>
            name === "revenue"
              ? [`৳${value.toLocaleString("bn-BD")}`, "আয়"]
              : [value, "অর্ডার"]
          }
          contentStyle={{ fontSize: "0.75rem", fontFamily: "var(--font-ui)" }}
        />
        <Legend
          wrapperStyle={{
            fontSize: "0.7rem",
            fontFamily: "var(--font-bengali)",
          }}
          formatter={(value) => (value === "revenue" ? "আয়" : "অর্ডার")}
        />
        <Line
          yAxisId="orders"
          type="monotone"
          dataKey="orderCount"
          stroke="var(--dash-blue)"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line
          yAxisId="revenue"
          type="monotone"
          dataKey="revenue"
          stroke="#94b8ea"
          strokeWidth={2}
          strokeDasharray="4 3"
          dot={{ r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
