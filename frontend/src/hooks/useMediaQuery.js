import { useState, useEffect } from "react";

/**
 * Tracks whether a CSS media query currently matches, re-rendering on
 * change (e.g. window resize, device rotation). Used by GlobalTopBar to
 * decide between its single-row (desktop) and split-row (narrow screen)
 * layouts in JS rather than CSS alone — the split needs to be a real
 * conditional render (not two copies of PageCountNav/ZoomControl shown/
 * hidden via CSS) so their internal state (e.g. ZoomControl's dropdown
 * open/closed) and event listeners only ever exist once at a time.
 *
 * SSR-safe: falls back to `false` when `window` isn't available yet (this
 * app has no SSR today, but this keeps the hook honest about that case
 * rather than assuming `window` always exists).
 *
 * @param {string} query e.g. "(max-width: 768px)"
 * @returns {boolean}
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handleChange = () => setMatches(mql.matches);
    handleChange(); // query string itself can change between renders
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}
