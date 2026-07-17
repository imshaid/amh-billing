import { useCallback, useEffect, useRef, useState } from "react";
import { getPagesBySet } from "../db/pages.repository.js";

/**
 * Loads all Pages for a given Set (already ordered by date ascending — see
 * `getPagesBySet`, which uses the `by_setId_date` compound index). Returns
 * `null` for `pages` while `setId` itself is null/undefined, so callers can
 * tell "no Set selected yet" apart from "Set selected but has zero pages".
 *
 * `refresh()` only flips `status` to "loading" on the very first fetch for
 * a given `setId`, not on every subsequent call. This matters a lot in
 * practice: every inline edit, page add, and page delete in CanvasArea
 * calls `refresh()` to pick up the write — if each of those also flipped
 * `status` back to "loading", CanvasArea's `status === "loading"` branch
 * would unmount the entire canvas (replacing it with a loading placeholder)
 * and remount it once the fetch resolved, which is what was causing the
 * whole workspace to jump back to the top of the scroll on every keystroke
 * commit or page action. Subsequent refreshes update `pages` in place while
 * `status` stays "ready", so React only re-renders the parts that actually
 * changed instead of tearing down the tree.
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
  const hasLoadedOnceRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!setId) {
      setPages(null);
      setStatus("idle");
      hasLoadedOnceRef.current = false;
      return;
    }
    try {
      if (!hasLoadedOnceRef.current) {
        setStatus("loading");
      }
      const result = await getPagesBySet(setId);
      setPages(result);
      setStatus("ready");
      hasLoadedOnceRef.current = true;
    } catch (err) {
      console.error(`[usePages] failed to load pages for set ${setId}:`, err);
      setError(err.message);
      setStatus("error");
    }
  }, [setId]);

  useEffect(() => {
    hasLoadedOnceRef.current = false; // a new setId is a fresh load, show loading again
    refresh();
  }, [refresh]);

  return { pages, status, error, refresh };
}
