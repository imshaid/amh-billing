import { useEffect, useState } from "react";
import { getAllPackages } from "../db/packages.repository.js";

/** Display order for grouping — categories not in this list (i.e. `null`,
 * the à la carte items like Biscuit/Juice/Water) are shown first under an
 * "Normal" heading, matching the original menu's own "Normal" section (see
 * project files: packageitem.pdf) before Snacks/Lunch/Iftar. */
const CATEGORY_ORDER = ["Normal", "Snacks", "Lunch", "Iftar"];

/**
 * Loads all Packages once and groups them by category for the picker UI.
 * Packages are seeded once at app bootstrap (see App.jsx / seedPackagesIfEmpty)
 * and edited rarely relative to how often they're read, so a one-shot load
 * without a live subscription is enough here — refresh() is exposed for the
 * (future) Package editor to call after a save.
 *
 * @returns {{
 *   groupedPackages: { category: string, packages: import('../domain/models/Package.js').Package[] }[],
 *   status: "loading"|"ready"|"error",
 *   error: string|null,
 *   refresh: () => Promise<void>,
 * }}
 */
export function usePackages() {
  const [groupedPackages, setGroupedPackages] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  async function refresh() {
    try {
      setStatus("loading");
      const all = await getAllPackages();
      setGroupedPackages(groupByCategory(all));
      setStatus("ready");
    } catch (err) {
      console.error("[usePackages] failed to load packages:", err);
      setError(err.message);
      setStatus("error");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return { groupedPackages, status, error, refresh };
}

/** @param {import('../domain/models/Package.js').Package[]} packages */
function groupByCategory(packages) {
  const byCategory = new Map();
  for (const pkg of packages) {
    const key = pkg.category ?? "Normal";
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key).push(pkg);
  }

  return CATEGORY_ORDER.filter((category) => byCategory.has(category)).map(
    (category) => ({ category, packages: byCategory.get(category) }),
  );
}
