import { useEffect, useRef, useState } from "react";
import { getAllPackages } from "../db/packages.repository.js";

/** Display order for grouping — categories not in this list (i.e. `null`,
 * the à la carte items like Biscuit/Juice/Water) are shown first under an
 * "Normal" heading, matching the original menu's own "Normal" section (see
 * project files: packageitem.pdf) before Snacks/Lunch/Iftar. These keys
 * match `Package.category`'s stored values exactly (see domain/models/
 * Package.js) — do not translate them here, only their display label below. */
const CATEGORY_ORDER = ["Normal", "Snacks", "Lunch", "Iftar"];

/** Bangla labels shown in the picker UI. Kept separate from CATEGORY_ORDER
 * (and from `Package.category`'s actual stored value) so the UI can be in
 * Bangla without touching the English category strings persisted in
 * IndexedDB — see docs/data-model.md, Package.category is typed as
 * "Snacks"|"Lunch"|"Iftar"|null and nothing reads/writes a Bangla version
 * of it anywhere else in the app. */
const CATEGORY_LABELS = {
  Normal: "সাধারণ",
  Snacks: "নাস্তা",
  Lunch: "লাঞ্চ",
  Iftar: "ইফতার",
};

/**
 * Loads all Packages once and groups them by category for the picker UI.
 * Packages are seeded once at app bootstrap (see App.jsx / seedPackagesIfEmpty)
 * and edited rarely relative to how often they're read, so a one-shot load
 * without a live subscription is enough here — refresh() is exposed for the
 * (future) Package editor to call after a save.
 *
 * @returns {{
 *   groupedPackages: { category: string, label: string, packages: import('../domain/models/Package.js').Package[] }[],
 *   status: "loading"|"ready"|"error",
 *   error: string|null,
 *   refresh: () => Promise<void>,
 * }}
 */
export function usePackages() {
  const [groupedPackages, setGroupedPackages] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const hasLoadedOnceRef = useRef(false);

  async function refresh() {
    try {
      if (!hasLoadedOnceRef.current) {
        setStatus("loading");
      }
      const all = await getAllPackages();
      setGroupedPackages(groupByCategory(all));
      setStatus("ready");
      hasLoadedOnceRef.current = true;
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
    (category) => ({
      category,
      label: CATEGORY_LABELS[category] ?? category,
      packages: byCategory.get(category),
    }),
  );
}
