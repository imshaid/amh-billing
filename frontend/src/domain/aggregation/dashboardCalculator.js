import { recomputeBillTotals } from "./billCalculator.js";

/**
 * Pure functions turning raw Sets/Pages/Packages into the shapes the
 * dashboard (features/landing/LandingPage.jsx and its chart components)
 * actually renders. No Supabase access here — same reasoning as
 * billCalculator.js: these operate on plain arrays already fetched by
 * hooks/useDashboardData.js, so they're trivially testable in isolation
 * and reusable if a future export/report feature needs the same numbers.
 *
 * Every function here treats a Set's Bill page as the authoritative
 * source of what was actually sold — same convention useSessionSummaries.js
 * already uses (recomputeBillTotals on the Bill page's own lineItems) —
 * not the Invoice pages, which exist to split one Bill's quantities across
 * multiple delivery destinations rather than represent additional sales.
 */

/**
 * @typedef {Object} DashboardRow
 * @property {import('../models/Set.js').Set} set
 * @property {import('../models/Page.js').Page|null} billPage
 * @property {number} total          From recomputeBillTotals — 0 if there's no Bill page yet.
 * @property {string|null} displayDate  ISO date — same fallback chain as useSessionSummaries.
 */

/**
 * Builds one row per Set — the shared input every other function below
 * filters/aggregates from. Computed once per dashboard load (see
 * useDashboardData.js) rather than recomputed per-chart.
 *
 * @param {import('../models/Set.js').Set[]} sets
 * @param {Map<string, import('../models/Page.js').Page[]>} pagesBySetId
 * @returns {DashboardRow[]}
 */
export function buildDashboardRows(sets, pagesBySetId) {
  return sets.map((set) => {
    const pages = pagesBySetId.get(set.id) ?? [];
    const billPage = pages.find((p) => p.type === "bill") ?? null;
    const firstInvoice = pages.find((p) => p.type === "invoice");
    return {
      set,
      billPage,
      total: billPage ? (recomputeBillTotals(billPage).total ?? 0) : 0,
      displayDate: set.purchaseDate || firstInvoice?.date || set.createdAt,
    };
  });
}

/** @param {string|null} isoDateOrTimestamp */
function toDateOnly(isoDateOrTimestamp) {
  if (!isoDateOrTimestamp) return null;
  return isoDateOrTimestamp.slice(0, 10); // "YYYY-MM-DD" from either a date or a full ISO timestamp
}

/** @param {string} isoDate "YYYY-MM-DD" */
function toDayjsLikeDate(isoDate) {
  return new Date(`${isoDate}T00:00:00`);
}

/**
 * @typedef {"7d"|"30d"|"6m"|"all"} TimeRange
 */

/**
 * Cutoff date (inclusive) for a given range, or `null` for "all" (no
 * filtering). Anchored to today's calendar date, not "now" — a Set dated
 * today should always be included regardless of what time it currently is.
 *
 * @param {TimeRange} range
 * @returns {Date|null}
 */
export function getRangeCutoff(range) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  switch (range) {
    case "7d": {
      const d = new Date(today);
      d.setDate(d.getDate() - 6); // inclusive of today = 7 days total
      return d;
    }
    case "30d": {
      const d = new Date(today);
      d.setDate(d.getDate() - 29);
      return d;
    }
    case "6m": {
      const d = new Date(today);
      d.setMonth(d.getMonth() - 6);
      return d;
    }
    case "all":
    default:
      return null;
  }
}

/**
 * @param {DashboardRow[]} rows
 * @param {TimeRange} range
 * @returns {DashboardRow[]}
 */
export function filterRowsByRange(rows, range) {
  const cutoff = getRangeCutoff(range);
  if (!cutoff) return rows;
  return rows.filter((row) => {
    const dateOnly = toDateOnly(row.displayDate);
    if (!dateOnly) return false;
    return toDayjsLikeDate(dateOnly) >= cutoff;
  });
}

/**
 * @typedef {Object} DashboardStats
 * @property {number} todaySales
 * @property {number} monthSales
 * @property {number} totalSessions
 */

/**
 * @param {DashboardRow[]} allRows  Unfiltered — stats are always "today"/
 *   "this month" regardless of whatever time-range the charts below are
 *   currently showing, since mixing the two would be confusing (a "7 din"
 *   chart filter silently also changing what "today's sales" means).
 * @returns {DashboardStats}
 */
export function computeStats(allRows) {
  const todayKey = toDateOnly(new Date().toISOString());
  const thisMonthKey = todayKey.slice(0, 7); // "YYYY-MM"

  let todaySales = 0;
  let monthSales = 0;

  for (const row of allRows) {
    const dateOnly = toDateOnly(row.displayDate);
    if (!dateOnly) continue;
    if (dateOnly === todayKey) todaySales += row.total;
    if (dateOnly.slice(0, 7) === thisMonthKey) monthSales += row.total;
  }

  return {
    todaySales,
    monthSales,
    totalSessions: allRows.length,
  };
}

/**
 * @typedef {Object} IncomePoint
 * @property {string} label   Display label (dd/mm for day-granularity, "MMM YYYY" for month-granularity).
 * @property {string} dateKey Sort key, "YYYY-MM-DD" or "YYYY-MM".
 * @property {number} total
 */

/**
 * Buckets rows by day (for 7d/30d) or by month (for 6m/all) — daily bars
 * over a 6-month-or-longer range would be too dense to read, so the
 * granularity itself adapts to the range rather than being a separate
 * setting the user has to also manage.
 *
 * @param {DashboardRow[]} rows  Already filtered by range (see filterRowsByRange).
 * @param {TimeRange} range
 * @returns {IncomePoint[]}
 */
export function buildIncomeTrend(rows, range) {
  const byDay = range === "7d" || range === "30d";
  const buckets = new Map();

  for (const row of rows) {
    const dateOnly = toDateOnly(row.displayDate);
    if (!dateOnly) continue;
    const key = byDay ? dateOnly : dateOnly.slice(0, 7);
    buckets.set(key, (buckets.get(key) ?? 0) + row.total);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, total]) => ({
      dateKey,
      label: byDay ? formatDayLabel(dateKey) : formatMonthLabel(dateKey),
      total,
    }));
}

/** @param {string} isoDate "YYYY-MM-DD" */
function formatDayLabel(isoDate) {
  const [, m, d] = isoDate.split("-");
  return `${d}/${m}`;
}

const MONTH_LABELS_EN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
/** @param {string} yearMonth "YYYY-MM" */
function formatMonthLabel(yearMonth) {
  const [y, m] = yearMonth.split("-");
  return `${MONTH_LABELS_EN[Number(m) - 1]} ${y}`;
}

/**
 * @typedef {Object} BreakdownSlice
 * @property {string} label
 * @property {number} total
 * @property {number} count
 */

/**
 * Sums each row's contribution under whatever `entriesFn` returns for that
 * row. Returns slices sorted descending by total, capped at `maxSlices`
 * with any remainder folded into an "অন্যান্য" (other) slice — a chart
 * with 30 tiny slivers is unreadable, and the long tail is rarely what the
 * person actually wants to see.
 *
 * @param {DashboardRow[]} rows
 * @param {(row: DashboardRow) => [string, number][]} entriesFn  Returns
 *   [label, amount] pairs this row contributes — usually one pair, but
 *   category breakdown needs one pair per lineItem (see
 *   buildCategoryBreakdown), hence an array rather than a single pair.
 * @param {number} maxSlices
 * @returns {BreakdownSlice[]}
 */
function buildBreakdown(rows, entriesFn, maxSlices = 8) {
  const totals = new Map(); // label -> { total, count }
  for (const row of rows) {
    for (const [label, amount] of entriesFn(row)) {
      const existing = totals.get(label) ?? { total: 0, count: 0 };
      existing.total += amount;
      existing.count += 1;
      totals.set(label, existing);
    }
  }

  const sorted = [...totals.entries()]
    .map(([label, { total, count }]) => ({ label, total, count }))
    .sort((a, b) => b.total - a.total);

  if (sorted.length <= maxSlices) return sorted;

  const head = sorted.slice(0, maxSlices - 1);
  const tail = sorted.slice(maxSlices - 1);
  const otherTotal = tail.reduce((sum, s) => sum + s.total, 0);
  const otherCount = tail.reduce((sum, s) => sum + s.count, 0);
  return [...head, { label: "অন্যান্য", total: otherTotal, count: otherCount }];
}

/**
 * Category-wise breakdown — sums each lineItem's amount under the
 * *current* category of the Package it references (via `packageId`, see
 * Page.js's own note that this is a reference-only field, not a live
 * binding). A lineItem whose Package has since been deleted, or whose
 * `packageId` doesn't resolve for any other reason, is attributed to
 * "অজানা" (unknown) rather than silently dropped or crashing — per this
 * project's own decision to prefer showing every টাকা somewhere over
 * pretending it doesn't exist.
 *
 * @param {DashboardRow[]} rows
 * @param {Map<string, import('../models/Package.js').Package>} packagesById
 * @param {Map<string, import('../models/Category.js').Category>} categoriesById
 * @returns {BreakdownSlice[]}
 */
export function buildCategoryBreakdown(rows, packagesById, categoriesById) {
  return buildBreakdown(rows, (row) => {
    if (!row.billPage) return [];
    return row.billPage.lineItems.map((item) => {
      const pkg = item.packageId ? packagesById.get(item.packageId) : null;
      const category = pkg?.categoryId
        ? categoriesById.get(pkg.categoryId)
        : null;
      const label = category?.name ?? "অজানা";
      return [label, item.amount ?? 0];
    });
  });
}

/**
 * Top packages by total sales amount across every Bill page's lineItems —
 * keyed by `packageName` (the frozen snapshot on the lineItem itself, see
 * Page.js), not by looking up the current Package — a package that's
 * since been renamed or deleted should still show up under the name it
 * was actually sold as, which is exactly what makes this a *sales*
 * report rather than a live catalog view.
 *
 * @param {DashboardRow[]} rows
 * @returns {BreakdownSlice[]}
 */
export function buildTopPackages(rows) {
  return buildBreakdown(rows, (row) => {
    if (!row.billPage) return [];
    return row.billPage.lineItems.map((item) => [
      item.packageName || "নামহীন",
      item.amount ?? 0,
    ]);
  });
}

/**
 * Buyer-wise breakdown — one entry per Set, keyed by the Bill page's
 * buyerName (falling back to the Set's own defaults.buyerName for a
 * brand-new session with no Bill page yet — same fallback
 * useSessionSummaries.js uses).
 *
 * @param {DashboardRow[]} rows
 * @returns {BreakdownSlice[]}
 */
export function buildBuyerBreakdown(rows) {
  return buildBreakdown(rows, (row) => {
    const buyerName =
      row.billPage?.buyerName || row.set.defaults?.buyerName || "অজানা";
    return [[buyerName, row.total]];
  });
}

/**
 * Ordered-by-person breakdown — the primary "who placed this order"
 * dimension (see this project's own decision: Set.orderedByPerson is
 * primary, buyerName is the secondary/separate chart above).
 *
 * @param {DashboardRow[]} rows
 * @returns {BreakdownSlice[]}
 */
export function buildOrderedByPersonBreakdown(rows) {
  return buildBreakdown(rows, (row) => {
    const person = row.set.orderedByPerson?.trim() || "অজানা";
    return [[person, row.total]];
  });
}

/**
 * @typedef {Object} DailyOrderLine
 * @property {string} packageName
 * @property {number} quantity
 * @property {number|null} rate
 * @property {number} amount
 * @property {string} buyerName
 * @property {string} setName
 * @property {string} setId
 */

/**
 * Every Bill-page lineItem across every Set whose `displayDate` falls on
 * exactly `isoDate` — this is the "what got ordered on this specific day"
 * view (see this project's own decision for a date-navigable daily order
 * detail), not a range aggregate like everything else in this file.
 *
 * @param {DashboardRow[]} allRows  Unfiltered by time-range — this is its
 *   own independent date-picker, separate from the range filter the
 *   charts use.
 * @param {string} isoDate "YYYY-MM-DD"
 * @returns {DailyOrderLine[]}
 */
export function buildDailyOrderDetail(allRows, isoDate) {
  const lines = [];
  for (const row of allRows) {
    if (toDateOnly(row.displayDate) !== isoDate) continue;
    if (!row.billPage) continue;
    const buyerName =
      row.billPage.buyerName || row.set.defaults?.buyerName || "অজানা";
    for (const item of row.billPage.lineItems) {
      if (!item.packageName) continue;
      lines.push({
        packageName: item.packageName,
        quantity: item.quantity ?? 0,
        rate: item.rate,
        amount: item.amount ?? 0,
        buyerName,
        setName: row.set.name,
        setId: row.set.id,
      });
    }
  }
  return lines.sort((a, b) => b.amount - a.amount);
}
