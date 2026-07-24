import { useMemo, useState } from "react";
import { useAppState } from "../../state/useAppState.js";
import { useSets } from "../../hooks/useSets.js";
import { useOrderedByPersons } from "../../hooks/useOrderedByPersons.js";
import { useDashboardData } from "../../hooks/useDashboardData.js";
import {
  filterRowsByRange,
  computeStats,
  buildIncomeTrend,
  buildCategoryBreakdown,
  buildTopPackages,
  buildBuyerBreakdown,
  buildOrderedByPersonBreakdown,
  buildDailyOrderDetail,
} from "../../domain/aggregation/dashboardCalculator.js";
import NewSessionModal from "./NewSessionModal.jsx";
import KpiCard from "./dashboard/KpiCard.jsx";
import TimeRangeSelector from "./dashboard/TimeRangeSelector.jsx";
import IncomeTrendChart from "./dashboard/IncomeTrendChart.jsx";
import DonutChart from "./dashboard/DonutChart.jsx";
import BreakdownBarChart from "./dashboard/BreakdownBarChart.jsx";
import DailyOrderDetail from "./dashboard/DailyOrderDetail.jsx";
import styles from "./LandingPage.module.css";

/** Today as "YYYY-MM-DD" in local time (not UTC — see toDateOnly's own
 * callers in dashboardCalculator.js, which all key off local calendar
 * days, not UTC-shifted ones). */
function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Home screen — a real, dense business dashboard (see this project's own
 * decision, researched against actual hotel/admin dashboard UI
 * conventions rather than guessed at) built to fit entirely within one
 * viewport on large screens, no scrolling — see LandingPage.module.css's
 * grid, and AppRouter.jsx's own decision to give this view the same
 * no-scroll container WorkspaceView uses. On narrow screens the same
 * grid collapses to a scrollable single column (see the media query in
 * LandingPage.module.css) — a non-scrollable *requirement* only applies
 * to desktop-sized viewports; a phone genuinely cannot show this much at
 * once without scrolling, and forcing it to would just make everything
 * illegibly small instead.
 *
 * "নতুন সেশন"/"আগের সেশনসমূহ"/"প্যাকেজ" are no longer a separate row of
 * FeatureCards below the dashboard — per this project's own decision,
 * they're folded directly into the grid (see the `.quickActionCard`
 * cells) so the whole screen reads as one cohesive dashboard rather than
 * "charts, then also a separate app-launcher section."
 *
 * There is no more separate "Analytics" screen/card — that content lives
 * directly here now (see AppRouter.jsx's own decision to drop the
 * "analytics" view entirely).
 *
 * One shared `timeRange` (see TimeRangeSelector) drives every chart at
 * once; the KPI cards and the daily order detail are each independent of
 * it (see computeStats' own doc comment on why "today"/"this month" stay
 * fixed, and DailyOrderDetail's own date picker for why a specific day is
 * its own separate concern from a range).
 */
export default function LandingPage() {
  const { dispatch } = useAppState();
  const { sets, createSet } = useSets();
  const previousPersons = useOrderedByPersons(sets);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedDate, setSelectedDate] = useState(todayIso());

  const { rows, packagesById, categoriesById, status } = useDashboardData();

  const stats = useMemo(() => computeStats(rows), [rows]);

  const filteredRows = useMemo(
    () => filterRowsByRange(rows, timeRange),
    [rows, timeRange],
  );

  const incomeTrend = useMemo(
    () => buildIncomeTrend(filteredRows, timeRange),
    [filteredRows, timeRange],
  );
  const categoryBreakdown = useMemo(
    () => buildCategoryBreakdown(filteredRows, packagesById, categoriesById),
    [filteredRows, packagesById, categoriesById],
  );
  const topPackages = useMemo(
    () => buildTopPackages(filteredRows),
    [filteredRows],
  );
  const buyerBreakdown = useMemo(
    () => buildBuyerBreakdown(filteredRows),
    [filteredRows],
  );
  const personBreakdown = useMemo(
    () => buildOrderedByPersonBreakdown(filteredRows),
    [filteredRows],
  );
  const dailyLines = useMemo(
    () => buildDailyOrderDetail(rows, selectedDate),
    [rows, selectedDate],
  );

  async function handleConfirmNewSession({ purchaseDate, orderedByPerson }) {
    const set = await createSet({
      name: `নতুন সেশন — ${new Date().toLocaleDateString("bn-BD")}`,
      purchaseDate,
      orderedByPerson,
    });
    setIsNewSessionModalOpen(false);
    dispatch({ type: "OPEN_SESSION", payload: set.id });
  }

  if (status === "loading") {
    return (
      <div className={styles.loadingScreen}>
        <p className={styles.loadingNote}>লোড হচ্ছে…</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.topRow}>
        <KpiCard
          icon="৳"
          color="blue"
          label="আজকের বিক্রয়"
          value={`৳${stats.todaySales.toLocaleString("bn-BD")}`}
          trendPct={stats.todayTrendPct}
          trendLabel="গতকালের তুলনায়"
        />
        <KpiCard
          icon="📈"
          color="teal"
          label="এই মাসের আয়"
          value={`৳${stats.monthSales.toLocaleString("bn-BD")}`}
          trendPct={stats.monthTrendPct}
          trendLabel="গত মাসের তুলনায়"
        />
        <KpiCard
          icon="📁"
          color="purple"
          label="মোট সেশন"
          value={stats.totalSessions.toLocaleString("bn-BD")}
          trendPct={null}
          trendLabel="সর্বমোট"
        />
        <button
          type="button"
          className={styles.quickActionCard}
          onClick={() => setIsNewSessionModalOpen(true)}
        >
          <span className={styles.quickActionIcon}>📄</span>
          <span className={styles.quickActionLabel}>নতুন সেশন</span>
        </button>
        <button
          type="button"
          className={styles.quickActionCard}
          onClick={() =>
            dispatch({ type: "SET_VIEW", payload: "previousSessions" })
          }
        >
          <span className={styles.quickActionIcon}>🕐</span>
          <span className={styles.quickActionLabel}>আগের সেশনসমূহ</span>
        </button>
        <button
          type="button"
          className={styles.quickActionCard}
          onClick={() => dispatch({ type: "SET_VIEW", payload: "packages" })}
        >
          <span className={styles.quickActionIcon}>📦</span>
          <span className={styles.quickActionLabel}>প্যাকেজ</span>
        </button>
      </div>

      <div className={styles.rangeRow}>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      <div className={styles.mainGrid}>
        <div className={`${styles.card} ${styles.incomeCard}`}>
          <p className={styles.cardTitle}>
            <span className={`${styles.titleDot} ${styles.dot_blue}`} />
            আয়ের প্রবণতা
          </p>
          <div className={styles.chartBody}>
            <IncomeTrendChart data={incomeTrend} />
          </div>
        </div>

        <div className={`${styles.card} ${styles.donutCard}`}>
          <p className={styles.cardTitle}>
            <span className={`${styles.titleDot} ${styles.dot_orange}`} />
            ক্যাটাগরি অনুযায়ী বিক্রয়
          </p>
          <DonutChart data={categoryBreakdown} />
        </div>

        <div className={styles.card}>
          <p className={styles.cardTitle}>
            <span className={`${styles.titleDot} ${styles.dot_orange}`} />
            জনপ্রিয় প্যাকেজ
          </p>
          <div className={styles.chartBody}>
            <BreakdownBarChart data={topPackages} />
          </div>
        </div>

        <div className={styles.card}>
          <p className={styles.cardTitle}>
            <span className={`${styles.titleDot} ${styles.dot_purple}`} />
            অর্ডারকারী ব্যক্তি
          </p>
          <div className={styles.chartBody}>
            <BreakdownBarChart data={personBreakdown} />
          </div>
        </div>

        <div className={styles.card}>
          <p className={styles.cardTitle}>
            <span className={`${styles.titleDot} ${styles.dot_purple}`} />
            ক্রেতা অনুযায়ী
          </p>
          <div className={styles.chartBody}>
            <BreakdownBarChart data={buyerBreakdown} />
          </div>
        </div>
      </div>

      <div className={styles.bottomRow}>
        <DailyOrderDetail
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          lines={dailyLines}
        />
      </div>

      {isNewSessionModalOpen && (
        <NewSessionModal
          previousPersons={previousPersons}
          onConfirm={handleConfirmNewSession}
          onCancel={() => setIsNewSessionModalOpen(false)}
        />
      )}
    </div>
  );
}
