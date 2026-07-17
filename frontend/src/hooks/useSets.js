import { useCallback, useEffect, useState } from "react";
import { getAllSets, addSet } from "../db/sets.repository.js";

/**
 * Loads every Set from IndexedDB and exposes a `refresh` + `createSet` pair
 * so components never call the repository directly — this is the one place
 * that owns "what does the Sidebar's Set list look like right now".
 *
 * Sorted by `updatedAt` descending (most recently touched Set first) since
 * that's the one the user almost always wants to resume — this is a display
 * concern local to this hook, separate from `Set.pageIds` ordering (which is
 * about Pages *within* a Set, documented in docs/data-model.md).
 *
 * @returns {{
 *   sets: import('../domain/models/Set.js').Set[],
 *   status: "loading"|"ready"|"error",
 *   error: string|null,
 *   refresh: () => Promise<void>,
 *   createSet: (input: Partial<import('../domain/models/Set.js').Set>) => Promise<import('../domain/models/Set.js').Set>,
 * }}
 */
export function useSets() {
  const [sets, setSets] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const all = await getAllSets();
      all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      setSets(all);
      setStatus("ready");
    } catch (err) {
      console.error("[useSets] failed to load sets:", err);
      setError(err.message);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createSet = useCallback(
    async (input) => {
      const set = await addSet(input);
      await refresh();
      return set;
    },
    [refresh],
  );

  return { sets, status, error, refresh, createSet };
}
