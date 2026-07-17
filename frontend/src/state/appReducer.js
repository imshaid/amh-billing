/**
 * Pure reducer for App-level UI state — NOT persisted data. This only tracks
 * "what is the user currently looking at" (which Set is open, which Page is
 * active in the canvas, which BottomPanel tab is selected, whether the mobile
 * sidebar drawer is open). The actual Set/Page/Package records themselves
 * live in IndexedDB and are loaded via the hooks in `src/hooks/` — this
 * reducer never holds a copy of that data, only ids and view-mode flags, so
 * there is exactly one source of truth for each kind of thing.
 */

/** @typedef {"packages"|"actions"} BottomTab */

/**
 * @typedef {Object} AppState
 * @property {string|null} activeSetId
 * @property {string|null} activePageId
 * @property {BottomTab} activeBottomTab
 * @property {boolean} isSidebarDrawerOpen   Mobile only; ignored on desktop layout.
 */

/** @type {AppState} */
export const initialAppState = {
  activeSetId: null,
  activePageId: null,
  activeBottomTab: "packages",
  isSidebarDrawerOpen: false,
};

/**
 * @param {AppState} state
 * @param {{ type: string, payload?: any }} action
 * @returns {AppState}
 */
export function appReducer(state, action) {
  switch (action.type) {
    case "SET_ACTIVE_SET":
      // Switching Sets always clears the active Page — a Page id from the
      // previous Set has no meaning in the new one, and leaving it set would
      // let CanvasArea try to render a Page that isn't in this Set's list.
      return {
        ...state,
        activeSetId: action.payload,
        activePageId: null,
      };

    case "SET_ACTIVE_PAGE":
      return { ...state, activePageId: action.payload };

    case "SET_BOTTOM_TAB":
      return { ...state, activeBottomTab: action.payload };

    case "OPEN_SIDEBAR_DRAWER":
      return { ...state, isSidebarDrawerOpen: true };

    case "CLOSE_SIDEBAR_DRAWER":
      return { ...state, isSidebarDrawerOpen: false };

    case "TOGGLE_SIDEBAR_DRAWER":
      return { ...state, isSidebarDrawerOpen: !state.isSidebarDrawerOpen };

    default:
      // Unknown action types are a programmer error, not a runtime condition
      // to silently ignore — throwing here surfaces typos in action.type
      // immediately during development instead of a UI that quietly does
      // nothing.
      throw new Error(`[appReducer] Unknown action type: ${action.type}`);
  }
}
