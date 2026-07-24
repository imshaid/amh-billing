import { useCallback, useEffect, useState } from "react";
import { getAllSets, subscribeToSets } from "../db/sets.repository.js";
import { getPagesBySet, subscribeToAllPages } from "../db/pages.repository.js";
import {
  getAllPackages,
  subscribeToPackages,
} from "../db/packages.repository.js";
import {
  getAllCategories,
  subscribeToCategories,
} from "../db/categories.repository.js";
import { buildDashboardRows } from "../domain/aggregation/dashboardCalculator.js";

/**
 * Loads everything the dashboard (features/landing/LandingPage.jsx) needs
 * in one place: every Set, every Set's Pages (N+1 — same intentional
 * approach as useSessionSummaries.js, see that file's own doc comment on
 * why that's fine at this app's data volume), every Package, and every
 * Category — then builds `rows` (see dashboardCalculator.js's
 * buildDashboardRows) plus lookup Maps for category/package-name
 * resolution.
 *
 * Subscribes to live changes on all four tables (sets/pages/packages/
 * categories) so the dashboard reflects another device's changes
 * automatically — see this project's own decision for row-level (not
 * keystroke-level) live sync across devices, same as every other hook.
 * Pages use `subscribeToAllPages` (see db/pages.repository.js) — an
 * unfiltered variant of the per-Set subscription the workspace view uses
 * (subscribeToPagesBySet), since the dashboard genuinely needs to know
 * about a Bill/Invoice edit anywhere, not just one Set.
 *
 * @returns {{
 *   rows: import('../domain/aggregation/dashboardCalculator.js').DashboardRow[],
 *   pagesBySetId: Map<string, import('../domain/models/Page.js').Page[]>,
 *   packagesById: Map<string, import('../domain/models/Package.js').Package>,
 *   categoriesById: Map<string, import('../domain/models/Category.js').Category>,
 *   status: "loading"|"ready"|"error",
 *   error: string|null,
 *   refresh: () => Promise<void>,
 * }}
 */
export function useDashboardData() {
  const [rows, setRows] = useState([]);
  const [pagesBySetId, setPagesBySetId] = useState(new Map());
  const [packagesById, setPackagesById] = useState(new Map());
  const [categoriesById, setCategoriesById] = useState(new Map());
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [sets, packages, categories] = await Promise.all([
        getAllSets(),
        getAllPackages(),
        getAllCategories(),
      ]);

      const pagesMap = new Map(
        await Promise.all(
          sets.map(async (set) => [set.id, await getPagesBySet(set.id)]),
        ),
      );

      setRows(buildDashboardRows(sets, pagesMap));
      setPagesBySetId(pagesMap);
      setPackagesById(new Map(packages.map((p) => [p.id, p])));
      setCategoriesById(new Map(categories.map((c) => [c.id, c])));
      setStatus("ready");
    } catch (err) {
      console.error("[useDashboardData] failed to load:", err);
      setError(err.message);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    refresh();
    const unsubSets = subscribeToSets(refresh);
    const unsubPages = subscribeToAllPages(refresh);
    const unsubPackages = subscribeToPackages(refresh);
    const unsubCategories = subscribeToCategories(refresh);
    return () => {
      unsubSets();
      unsubPages();
      unsubPackages();
      unsubCategories();
    };
  }, [refresh]);

  return {
    rows,
    pagesBySetId,
    packagesById,
    categoriesById,
    status,
    error,
    refresh,
  };
}
