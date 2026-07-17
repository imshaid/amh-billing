/**
 * Pure reducer for App-level UI state — NOT persisted data. This only tracks
 * "what is the user currently looking at" (which top-level screen, which Set
 * is open, which Page is highlighted in the canvas). The actual Set/Page/
 * Package records themselves live in IndexedDB and are loaded via the hooks
 * in `src/hooks/` — this reducer never holds a copy of that data, only ids
 * and view-mode flags, so there is exactly one source of truth for each
 * kind of thing.
 */

/**
 * @typedef {"landing"|"workspace"|"previousSessions"|"packages"|"analytics"} View
 * "workspace" is the single-session continuous-scroll canvas (see
 * WorkspaceView.jsx) — there is no Set-switching UI inside it; switching
 * Sets means returning to "landing" and picking again from "আগের
 * সেশনসমূহ" (previousSessions). The other two screens (packages, analytics)
 * are the remaining grid cards on the landing page. "landing" itself has no
 * card — it's the home screen the global top bar's title returns to.
 */

/**
 * @typedef {Object} AppState
 * @property {View} currentView
 * @property {string|null} activeSetId
 * @property {string|null} activePageId   Which page is currently scrolled to
 *   / highlighted in PageCountNav's dropdown — not a "tab selection", just a
 *   highlight cue, since CanvasArea renders every page at once now.
 */

/** @type {AppState} */
export const initialAppState = {
  currentView: "landing",
  activeSetId: null,
  activePageId: null,
};

/**
 * @param {AppState} state
 * @param {{ type: string, payload?: any }} action
 * @returns {AppState}
 */
export function appReducer(state, action) {
  switch (action.type) {
    case "SET_VIEW":
      return { ...state, currentView: action.payload };

    case "GO_HOME":
      // Deliberately clears activeSetId/activePageId rather than just
      // switching currentView back to "landing" and leaving them set. If the
      // user picks the same or a different Set from Previous Sessions next,
      // OPEN_SESSION below runs anyway and would reset activePageId to null
      // regardless — but leaving a stale activeSetId around while on the
      // landing screen risks a future card ("Continue last session") reading
      // it before the user has actually chosen to resume anything.
      return {
        ...state,
        currentView: "landing",
        activeSetId: null,
        activePageId: null,
      };

    case "OPEN_SESSION":
      // Landing page's "New Session"/"Previous Sessions" flows both end up
      // here once a concrete Set exists to work on: jump straight to the
      // workspace view with that Set active.
      return {
        ...state,
        currentView: "workspace",
        activeSetId: action.payload,
        activePageId: null,
      };

    case "SET_ACTIVE_PAGE":
      return { ...state, activePageId: action.payload };

    default:
      // Unknown action types are a programmer error, not a runtime condition
      // to silently ignore — throwing here surfaces typos in action.type
      // immediately during development instead of a UI that quietly does
      // nothing.
      throw new Error(`[appReducer] Unknown action type: ${action.type}`);
  }
}
