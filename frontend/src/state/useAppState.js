import { useContext } from "react";
import { AppStateContext } from "./AppStateContext.jsx";

/**
 * Access to the app-level UI state (active Set/Page ids, bottom tab, mobile
 * drawer). Throws immediately if called outside <AppStateProvider> rather
 * than silently returning null — a missing Provider is a wiring bug that
 * should fail loudly at the call site, not surface later as "activeSetId is
 * undefined" three components away.
 *
 * @returns {{ state: import('./appReducer.js').AppState, dispatch: import('react').Dispatch<any> }}
 */
export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error(
      "useAppState() was called outside <AppStateProvider>. Wrap the app " +
        "(see main.jsx) with <AppStateProvider> before rendering anything " +
        "that calls this hook.",
    );
  }
  return ctx;
}
