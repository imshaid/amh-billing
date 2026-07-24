import { useEffect, useRef, useState } from "react";
import {
  getAllPackages,
  subscribeToPackages,
} from "../db/packages.repository.js";

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
 * Loads all Packages and groups them by category for the picker UI. Also
 * subscribes to Supabase Realtime (see db/packages.repository.js's
 * subscribeToPackages) so that a Package added/edited/deleted on another
 * device reappears here automatically — see this project's own decision
 * for "row-level live sync, not keystroke-level": a save on Device A
 * shows up on Device B without Device B's user doing anything, but two
 * people editing the exact same field at the exact same moment isn't
 * coordinated character-by-character.
 *
 * `refresh()` is still exposed for the local caller (PackagesScreen/
 * PackagePickerPopup) to call right after its own save — that keeps the
 * saving device's own UI responsive immediately, rather than waiting on
 * its own Realtime echo to come back over the network.
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
    const unsubscribe = subscribeToPackages(() => {
      refresh();
    });
    return unsubscribe;
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
      packages: sortPackages(byCategory.get(category)),
    }),
  );
}

/**
 * Sorts a category's packages by `rate` ascending, falling back to a
 * lexicographic (locale-aware) comparison of `name` when two packages
 * share the same rate — see this project's own decision on picker
 * ordering. `null`/`undefined` rate sorts after every priced package
 * (treated as +Infinity) rather than crashing the comparison or sorting
 * to the front, since a package with no rate set yet is the exceptional
 * case, not the common one.
 *
 * Returns a new array — never mutates the array passed in, since that
 * array is a live reference held elsewhere (`byCategory.get(category)`
 * above, itself built directly from the `packages` state this hook owns).
 *
 * @param {import('../domain/models/Package.js').Package[]} packages
 * @returns {import('../domain/models/Package.js').Package[]}
 */
function sortPackages(packages) {
  return [...packages].sort((a, b) => {
    const rateA = a.rate ?? Infinity;
    const rateB = b.rate ?? Infinity;
    if (rateA !== rateB) return rateA - rateB;
    return a.name.localeCompare(b.name);
  });
}
