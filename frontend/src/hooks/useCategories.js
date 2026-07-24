import { useCallback, useEffect, useState } from "react";
import {
  getAllCategories,
  addCategory,
  subscribeToCategories,
} from "../db/categories.repository.js";

/**
 * Loads every Category (already sorted by displayOrder — see
 * getAllCategories) and exposes a `createCategory` helper, mirroring the
 * useSets/usePackages pattern. Subscribes to Supabase Realtime so a
 * category created/renamed/deleted on another device shows up here
 * automatically — see this project's own decision for row-level (not
 * keystroke-level) live sync across devices.
 *
 * @returns {{
 *   categories: import('../domain/models/Category.js').Category[],
 *   status: "loading"|"ready"|"error",
 *   error: string|null,
 *   refresh: () => Promise<void>,
 *   createCategory: (input: Partial<import('../domain/models/Category.js').Category>) => Promise<import('../domain/models/Category.js').Category>,
 * }}
 */
export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const all = await getAllCategories();
      setCategories(all);
      setStatus("ready");
    } catch (err) {
      console.error("[useCategories] failed to load categories:", err);
      setError(err.message);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    refresh();
    const unsubscribe = subscribeToCategories(() => {
      refresh();
    });
    return unsubscribe;
  }, [refresh]);

  const createCategory = useCallback(
    async (input) => {
      const category = await addCategory(input);
      await refresh();
      return category;
    },
    [refresh],
  );

  return { categories, status, error, refresh, createCategory };
}
