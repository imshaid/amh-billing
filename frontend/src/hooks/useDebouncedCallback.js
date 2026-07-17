import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a debounced version of `fn` — waits `delay`ms after the last call
 * before actually invoking. Used for inline-edit auto-save: typing updates
 * local state instantly (see EditableField), but the IndexedDB write itself
 * only fires once typing pauses, avoiding a write per keystroke.
 *
 * @param {(...args: any[]) => void} fn
 * @param {number} delay
 */
export function useDebouncedCallback(fn, delay = 500) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return useCallback(
    (...args) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fnRef.current(...args), delay);
    },
    [delay],
  );
}
