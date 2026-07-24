import { useMemo, useState } from "react";
import { useAppState } from "../../state/useAppState.js";
import { useOrderedByPersons } from "../../hooks/useOrderedByPersons.js";
import { useSets } from "../../hooks/useSets.js";
import { useDashboardData } from "../../hooks/useDashboardData.js";
import {
  filterRowsByMonth,
  currentYearMonth,
  computeStats,
  computeUniqueBuyers,
  computeUniqueAddresses,
  buildCategoryBreakdown,
  buildTopPackages,
  buildOrderedByPersonBreakdown,
  buildYearlyOrderRevenueTrend,
  buildDailyOrderDetail,
} from "../../domain/aggregation/dashboardCalculator.js";
import NewSessionModal from "./NewSessionModal.jsx";
import PackagesScreen from "../package-picker/PackagesScreen.jsx";
import PreviousSessionsScreen from "../session/PreviousSessionsScreen.jsx";
import MonthYearNavigator from "./dashboard/MonthYearNavigator.jsx";
import SegmentedCategoryBar from "./dashboard/SegmentedCategoryBar.jsx";
import DonutChart from "./dashboard/DonutChart.jsx";
import YearlyOrderRevenueChart from "./dashboard/YearlyOrderRevenueChart.jsx";
import DailyOrderDetail from "./dashboard/DailyOrderDetail.jsx";
import NamedListModal from "./dashboard/NamedListModal.jsx";
import ScreenPopup from "./dashboard/ScreenPopup.jsx";
import styles from "./LandingPage.module.css";

/** Today as "YYYY-MM-DD" local time — see dashboardCalculator.js's
 * toDateOnly's own callers, all local-calendar-day-keyed, not UTC. */
function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Home screen — a business dashboard built directly from this project's
 * own wireframe (see the two independent date navigators, the specific
 * widget shapes, and the click-to-popup KPI cards, all per that
 * wireframe rather than a generic "reference dashboard" guess).
 *
 * Two INDEPENDENT date navigators, per this project's own decision:
 *   1. `monthYear` (top-right MonthYearNavigator) drives every card
 *      EXCEPT the Yearly Order/Revenue chart and the Daily Order Table.
 *   2. `dailyOrderDate` (inside DailyOrderDetail, using the existing
 *      DateField calendar) drives ONLY that table.
 *   The Yearly chart has its own separate `chartYear` state (a plain
 *   number, not wired to either navigator above) since it always shows
 *   all 12 months of whichever year it's set to.
 *
 * "Total Buyers"/"Total Addresses"/"Total Packages"/"Total Sessions" are
 * all clickable (see this project's own decision): buyers/addresses open
 * a NamedListModal with the full list; packages/sessions open the actual
 * PackagesScreen/PreviousSessionsScreen as a popup (see ScreenPopup) —
 * reusing those screens' own components rather than building separate
 * summary views. PreviousSessionsScreen also has its own "নতুন সেশন"
 * button now (see that component's own doc comment) for exactly this
 * popup context.
 */
export default function LandingPage() {
  const { dispatch } = useAppState();
  const { sets, createSet } = useSets();
  const previousPersons = useOrderedByPersons(sets);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);

  const [monthYear, setMonthYear] = useState(currentYearMonth());
  const [chartYear, setChartYear] = useState(new Date().getFullYear());
  const [dailyOrderDate, setDailyOrderDate] = useState(todayIso());

  const [openPopup, setOpenPopup] = useState(null); // null | "buyers" | "addresses" | "packages" | "sessions"

  const { rows, pagesBySetId, packagesById, categoriesById, status } =
    useDashboardData();

  const monthRows = useMemo(
    () => filterRowsByMonth(rows, monthYear),
    [rows, monthYear],
  );

  const stats = useMemo(() => computeStats(rows), [rows]);
  const uniqueBuyers = useMemo(
    () => computeUniqueBuyers(monthRows),
    [monthRows],
  );
  const uniqueAddresses = useMemo(
    () => computeUniqueAddresses(monthRows, pagesBySetId),
    [monthRows, pagesBySetId],
  );
  const categoryBreakdown = useMemo(
    () => buildCategoryBreakdown(monthRows, packagesById, categoriesById),
    [monthRows, packagesById, categoriesById],
  );
  const topPackages = useMemo(() => buildTopPackages(monthRows), [monthRows]);
  const personBreakdown = useMemo(
    () => buildOrderedByPersonBreakdown(monthRows),
    [monthRows],
  );
  const yearlyTrend = useMemo(
    () => buildYearlyOrderRevenueTrend(rows, chartYear),
    [rows, chartYear],
  );
  const dailyLines = useMemo(
    () => buildDailyOrderDetail(rows, dailyOrderDate),
    [rows, dailyOrderDate],
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
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>AMH Billing</h1>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.newSessionButton}
            onClick={() => setIsNewSessionModalOpen(true)}
          >
            + নতুন সেশন
          </button>
          <MonthYearNavigator yearMonth={monthYear} onChange={setMonthYear} />
        </div>
      </div>

      <div className={styles.topSection}>
        <div className={`${styles.card} ${styles.monthlyCard}`}>
          <div className={styles.monthlyMetric}>
            <p className={styles.monthlyLabel}>মাসিক অর্ডার</p>
            <p className={styles.monthlyValue}>
              {monthRows.length.toLocaleString("bn-BD")}
              <span
                className={`${styles.monthlyTrendInline} ${
                  stats.monthTrendPct == null
                    ? ""
                    : stats.monthTrendPct >= 0
                      ? styles.trendUp
                      : styles.trendDown
                }`}
              >
                {stats.monthTrendPct == null
                  ? "—"
                  : `${stats.monthTrendPct >= 0 ? "▲" : "▼"} ${Math.abs(stats.monthTrendPct).toFixed(1)}%`}
              </span>
            </p>
          </div>

          <div className={styles.monthlyDivider} />

          <div className={styles.monthlyMetric}>
            <p className={styles.monthlyLabel}>মাসিক আয়</p>
            <p className={styles.monthlyValue}>
              ৳{stats.monthSales.toLocaleString("bn-BD")}
            </p>
            <div className={styles.miniChart}>
              <YearlyOrderRevenueChart data={yearlyTrend} compact />
            </div>
          </div>
        </div>

        <div className={styles.kpiBlock}>
          <button
            type="button"
            className={styles.kpiCard}
            onClick={() => setOpenPopup("sessions")}
          >
            <p className={styles.kpiLabel}>মোট সেশন</p>
            <p className={styles.kpiValue}>
              {stats.totalSessions.toLocaleString("bn-BD")}
            </p>
          </button>
          <button
            type="button"
            className={styles.kpiCard}
            onClick={() => setOpenPopup("packages")}
          >
            <p className={styles.kpiLabel}>মোট প্যাকেজ</p>
            <p className={styles.kpiValue}>
              {packagesById.size.toLocaleString("bn-BD")}
            </p>
          </button>
          <button
            type="button"
            className={styles.kpiCard}
            onClick={() => setOpenPopup("buyers")}
          >
            <p className={styles.kpiLabel}>মোট ক্রেতা</p>
            <p className={styles.kpiValue}>
              {uniqueBuyers.length.toLocaleString("bn-BD")}
            </p>
          </button>
          <button
            type="button"
            className={styles.kpiCard}
            onClick={() => setOpenPopup("addresses")}
          >
            <p className={styles.kpiLabel}>মোট ঠিকানা</p>
            <p className={styles.kpiValue}>
              {uniqueAddresses.length.toLocaleString("bn-BD")}
            </p>
          </button>
        </div>

        <div className={`${styles.card} ${styles.categoriesCard}`}>
          <p className={styles.cardTitle}>ক্যাটাগরি অনুযায়ী বিক্রয়</p>
          <SegmentedCategoryBar data={categoryBreakdown} />
        </div>
      </div>

      <div className={styles.mainGrid}>
        <div className={`${styles.card} ${styles.yearlyCard}`}>
          <div className={styles.cardHeaderRow}>
            <p className={styles.cardTitle}>বার্ষিক অর্ডার ও আয়</p>
            <div className={styles.yearNav}>
              <button
                type="button"
                className={styles.yearNavButton}
                onClick={() => setChartYear((y) => y - 1)}
                aria-label="আগের বছর"
              >
                ‹
              </button>
              <span className={styles.yearLabel}>{chartYear}</span>
              <button
                type="button"
                className={styles.yearNavButton}
                onClick={() => setChartYear((y) => y + 1)}
                aria-label="পরের বছর"
              >
                ›
              </button>
            </div>
          </div>
          <div className={styles.chartBody}>
            <YearlyOrderRevenueChart data={yearlyTrend} />
          </div>
        </div>

        <div className={styles.card}>
          <p className={styles.cardTitle}>প্যাকেজ</p>
          <DonutChart data={topPackages} centerLabel="মোট বিক্রয়" />
        </div>

        <div className={styles.card}>
          <p className={styles.cardTitle}>অর্ডারকারী ব্যক্তি</p>
          <DonutChart data={personBreakdown} centerLabel="মোট অর্ডার" />
        </div>
      </div>

      <div className={styles.bottomRow}>
        <DailyOrderDetail
          selectedDate={dailyOrderDate}
          onDateChange={setDailyOrderDate}
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

      {openPopup === "buyers" && (
        <NamedListModal
          title="ক্রেতার তালিকা"
          entries={uniqueBuyers}
          onClose={() => setOpenPopup(null)}
        />
      )}
      {openPopup === "addresses" && (
        <NamedListModal
          title="ঠিকানার তালিকা"
          entries={uniqueAddresses}
          onClose={() => setOpenPopup(null)}
        />
      )}
      {openPopup === "packages" && (
        <ScreenPopup onClose={() => setOpenPopup(null)}>
          <PackagesScreen />
        </ScreenPopup>
      )}
      {openPopup === "sessions" && (
        <ScreenPopup onClose={() => setOpenPopup(null)}>
          <PreviousSessionsScreen />
        </ScreenPopup>
      )}
    </div>
  );
}
