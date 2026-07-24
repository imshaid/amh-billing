import { useEffect, useRef, useState } from "react";
import {
  getAllPackages,
  subscribeToPackages,
} from "../db/packages.repository.js";
import { useCategories } from "./useCategories.js";

/**
 * Loads all Packages and groups them by Category (a real, user-managed
 * table now — see domain/models/Category.js and this project's own
 * decision to support fully dynamic categories, replacing the previous
 * fixed Snacks/Lunch/Iftar/null enum). Also subscribes to Supabase
 * Realtime (see db/packages.repository.js's subscribeToPackages) so that
 * a Package added/edited/deleted on another device reappears here
 * automatically — see this project's own decision for "row-level live
 * sync, not keystroke-level": a save on Device A shows up on Device B
 * without Device B's user doing anything, but two people editing the
 * exact same field at the exact same moment isn't coordinated
 * character-by-character.
 *
 * Internally calls `useCategories` — categories and packages are loaded
 * together here rather than requiring every caller (PackagePickerPopup,
 * PackagesScreen) to separately call both hooks and merge them
 * themselves.
 *
 * A Package whose `categoryId` doesn't match any existing Category (e.g.
 * a stale/orphaned row from before this migration, or a Category that
 * was deleted without cascading correctly) is grouped under a synthetic
 * "সাধারণ" bucket rather than silently dropped — see `UNCATEGORIZED_KEY`
 * below.
 *
 * `refresh()` is still exposed for the local caller (PackagesScreen/
 * PackagePickerPopup) to call right after its own save — that keeps the
 * saving device's own UI responsive immediately, rather than waiting on
 * its own Realtime echo to come back over the network.
 *
 * @returns {{
 *   groupedPackages: { categoryId: string|null, label: string, packages: import('../domain/models/Package.js').Package[] }[],
 *   categories: import('../domain/models/Category.js').Category[],
 *   status: "loading"|"ready"|"error",
 *   error: string|null,
 *   refresh: () => Promise<void>,
 * }}
 */
const UNCATEGORIZED_KEY = "__uncategorized__";

export function usePackages() {
  const [groupedPackages, setGroupedPackages] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const hasLoadedOnceRef = useRef(false);
  const {
    categories,
    status: categoriesStatus,
    refresh: refreshCategories,
  } = useCategories();

  async function refresh() {
    try {
      if (!hasLoadedOnceRef.current) {
        setStatus("loading");
      }
      const [all] = await Promise.all([getAllPackages(), refreshCategories()]);
      setGroupedPackages(groupByCategory(all, categories));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-group (without a full re-fetch) whenever categories change on
  // their own — e.g. a rename via useCategories' own Realtime
  // subscription — so the label shown here stays in sync without waiting
  // for the next Package-triggered refresh.
  useEffect(() => {
    if (!hasLoadedOnceRef.current) return;
    getAllPackages()
      .then((all) => setGroupedPackages(groupByCategory(all, categories)))
      .catch((err) =>
        console.error(
          "[usePackages] failed to re-group on category change:",
          err,
        ),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  return {
    groupedPackages,
    categories,
    status:
      status === "loading" || categoriesStatus === "loading"
        ? "loading"
        : status,
    error,
    refresh,
  };
}

/**
 * @param {import('../domain/models/Package.js').Package[]} packages
 * @param {import('../domain/models/Category.js').Category[]} categories
 */
function groupByCategory(packages, categories) {
  const byCategory = new Map();
  for (const pkg of packages) {
    const key = pkg.categoryId ?? UNCATEGORIZED_KEY;
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key).push(pkg);
  }

  const sortedCategories = [...categories].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  // Every Category gets a group — including ones with zero Packages yet.
  // Filtering those out (an earlier version of this function did) was a
  // real bug: a brand-new Category had no way to ever be reached, since
  // its tab would never appear until it already had a package in it, but
  // the "+ নতুন প্যাকেজ" button that adds a package to a category only
  // exists on that category's own (nonexistent) tab. Showing an empty tab
  // with a "0" count is the correct behavior — it's a real category the
  // user just created, not a category to hide until it's "earned" a
  // package.
  const groups = sortedCategories.map((category) => ({
    categoryId: category.id,
    label: category.name,
    packages: sortPackages(byCategory.get(category.id) ?? []),
  }));

  // Orphaned packages (categoryId pointing at nothing, or literally null)
  // still need to be visible somewhere rather than silently vanishing —
  // shown last, under a generic label, regardless of whether a real
  // "সাধারণ" category also exists with its own packages (those are two
  // separate groups: real ones under their real category, orphans here).
  if (byCategory.has(UNCATEGORIZED_KEY)) {
    groups.push({
      categoryId: null,
      label: "সাধারণ",
      packages: sortPackages(byCategory.get(UNCATEGORIZED_KEY)),
    });
  }

  return groups;
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
