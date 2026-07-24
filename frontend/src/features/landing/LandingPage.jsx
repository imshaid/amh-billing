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
import FeatureCard from "./FeatureCard.jsx";
import NewSessionModal from "./NewSessionModal.jsx";
import StatsStrip from "./dashboard/StatsStrip.jsx";
import TimeRangeSelector from "./dashboard/TimeRangeSelector.jsx";
import IncomeTrendChart from "./dashboard/IncomeTrendChart.jsx";
import BreakdownBarChart from "./dashboard/BreakdownBarChart.jsx";
import DailyOrderDetail from "./dashboard/DailyOrderDetail.jsx";
import RecentSessions from "./dashboard/RecentSessions.jsx";
import chartCardStyles from "./dashboard/ChartCard.module.css";
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
 * Home screen — now a real business dashboard (see this project's own
 * decision), not just a 4-card router. Still serves that original router
 * role too (see the compact "quick actions" row near the bottom), but the
 * bulk of the screen is stats/charts/records built from every Set/Page in
 * the database via useDashboardData.
 *
 * There is no more separate "Analytics" screen/card — that content lives
 * directly here now (see AppRouter.jsx's own decision to drop the
 * "analytics" view entirely).
 *
 * One shared `timeRange` (see TimeRangeSelector) drives every chart at
 * once; the stats strip and the daily order detail are each independent
 * of it (see StatsStrip's own doc comment on why "today"/"this month"
 * stay fixed, and DailyOrderDetail's own date picker for why a specific
 * day is its own separate concern from a range).
 *
 * "নতুন সেশন" opens NewSessionModal first (purchase date / ordered-by
 * person — both optional, see that component's own doc comment) rather
 * than creating the Set immediately. Only on the modal's "শুরু করুন" does
 * the Set actually get created — cancelling leaves the landing page
 * exactly as it was, no orphaned Set.
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

  function handleOpenSession(setId) {
    dispatch({ type: "OPEN_SESSION", payload: setId });
  }

  return (
    <div className={styles.dashboard}>
      <StatsStrip
        todaySales={stats.todaySales}
        monthSales={stats.monthSales}
        totalSessions={stats.totalSessions}
      />

      {status === "loading" && <p className={styles.loadingNote}>লোড হচ্ছে…</p>}

      {status === "ready" && (
        <>
          <div className={styles.rangeRow}>
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          </div>

          <div className={chartCardStyles.card}>
            <p className={chartCardStyles.title}>আয়ের প্রবণতা</p>
            <IncomeTrendChart data={incomeTrend} />
          </div>

          <div className={styles.chartGrid}>
            <div className={chartCardStyles.card}>
              <p className={chartCardStyles.title}>
                ক্যাটাগরি অনুযায়ী বিক্রয়
              </p>
              <BreakdownBarChart data={categoryBreakdown} />
            </div>
            <div className={chartCardStyles.card}>
              <p className={chartCardStyles.title}>জনপ্রিয় প্যাকেজ</p>
              <BreakdownBarChart data={topPackages} />
            </div>
            <div className={chartCardStyles.card}>
              <p className={chartCardStyles.title}>
                অর্ডারকারী ব্যক্তি অনুযায়ী
              </p>
              <BreakdownBarChart data={personBreakdown} />
            </div>
            <div className={chartCardStyles.card}>
              <p className={chartCardStyles.title}>ক্রেতা অনুযায়ী</p>
              <BreakdownBarChart data={buyerBreakdown} />
            </div>
          </div>

          <DailyOrderDetail
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            lines={dailyLines}
          />

          <RecentSessions rows={rows} onOpenSession={handleOpenSession} />
        </>
      )}

      <div className={styles.quickActions}>
        <FeatureCard
          icon="📄"
          title="নতুন সেশন"
          description="নতুন বিল বা চালান তৈরি শুরু করুন"
          onClick={() => setIsNewSessionModalOpen(true)}
        />
        <FeatureCard
          icon="🕐"
          title="আগের সেশনসমূহ"
          description="পুরনো সেশন খুঁজুন ও চালিয়ে যান"
          onClick={() =>
            dispatch({ type: "SET_VIEW", payload: "previousSessions" })
          }
        />
        <FeatureCard
          icon="📦"
          title="প্যাকেজ"
          description="মেনু প্যাকেজ দেখুন ও এডিট করুন"
          onClick={() => dispatch({ type: "SET_VIEW", payload: "packages" })}
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
