import { useCallback, useEffect, useState } from "react";
import { getPagesBySet } from "../db/pages.repository.js";

/**
 * Loads all Pages for a given Set (already ordered by date ascending — see
 * `getPagesBySet`, which uses the `by_setId_date` compound index). Returns
 * `null` for `pages` while `setId` itself is null/undefined, so callers can
 * tell "no Set selected yet" apart from "Set selected but has zero pages".
 *
 * @param {string|null} setId
 * @returns {{
 *   pages: import('../domain/models/Page.js').Page[]|null,
 *   status: "idle"|"loading"|"ready"|"error",
 *   error: string|null,
 *   refresh: () => Promise<void>,
 * }}
 */
export function usePages(setId) {
  const [pages, setPages] = useState(null);
  const [status, setStatus] = useState(setId ? "loading" : "idle");
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!setId) {
      setPages(null);
      setStatus("idle");
      return;
    }
    try {
      setStatus("loading");
      const result = await getPagesBySet(setId);
      setPages(result);
      setStatus("ready");
    } catch (err) {
      console.error(`[usePages] failed to load pages for set ${setId}:`, err);
      setError(err.message);
      setStatus("error");
    }
  }, [setId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { pages, status, error, refresh };
}
