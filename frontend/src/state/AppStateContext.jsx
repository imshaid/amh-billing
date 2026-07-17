import { createContext, useReducer } from "react";
import { appReducer, initialAppState } from "./appReducer.js";

/**
 * @type {import('react').Context<{
 *   state: import('./appReducer.js').AppState,
 *   dispatch: import('react').Dispatch<{type: string, payload?: any}>,
 * } | null>}
 */
export const AppStateContext = createContext(null);

/**
 * Wraps the app in a single Context carrying { state, dispatch }. Deliberately
 * not split into separate value/dispatch contexts (a common optimization) —
 * this app has one Provider near the root and a handful of consumers, so the
 * extra re-render this could cause is not worth the added indirection. If
 * CanvasArea-level re-render cost ever becomes measurable, revisit then.
 *
 * @param {{ children: import('react').ReactNode }} props
 */
export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialAppState);

  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
}
