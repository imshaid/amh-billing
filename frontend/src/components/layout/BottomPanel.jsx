import { useAppState } from "../../state/useAppState.js";
import PackagesTab from "./PackagesTab.jsx";
import ActionsTab from "./ActionsTab.jsx";
import styles from "./BottomPanel.module.css";

/**
 * Docked panel below CanvasArea. Two tabs sharing one panel rather than two
 * separate modals, so adding a line item (frequent, needs to feel instant)
 * and session-level actions (infrequent) both stay one click away without
 * either one crowding the live preview above.
 *
 * `pages`/`refreshPages` are passed straight through from AppShell's shared
 * `usePages` call down to whichever tab needs them (PackagesTab writes a
 * LineItem then calls `refreshPages` so CanvasArea's copy of `pages`
 * updates too — see the comment in AppShell.jsx).
 *
 * @param {{
 *   activeSetId: string|null,
 *   activePageId: string|null,
 *   pages: import('../../domain/models/Page.js').Page[]|null,
 *   refreshPages: () => Promise<void>,
 * }} props
 */
export default function BottomPanel({ activeSetId, activePageId, pages, refreshPages }) {
  const { state, dispatch } = useAppState();

  function selectTab(tab) {
    dispatch({ type: "SET_BOTTOM_TAB", payload: tab });
  }

  return (
    <div className={styles.panel}>
      <div className={styles.tabBar} role="tablist">
        <button
          role="tab"
          aria-selected={state.activeBottomTab === "packages"}
          className={`${styles.tabButton} ${
            state.activeBottomTab === "packages" ? styles.tabButtonActive : ""
          }`}
          onClick={() => selectTab("packages")}
        >
          Packages
        </button>
        <button
          role="tab"
          aria-selected={state.activeBottomTab === "actions"}
          className={`${styles.tabButton} ${
            state.activeBottomTab === "actions" ? styles.tabButtonActive : ""
          }`}
          onClick={() => selectTab("actions")}
        >
          Actions
        </button>
      </div>

      <div className={styles.tabContent}>
        {state.activeBottomTab === "packages" ? (
          <PackagesTab
            activeSetId={activeSetId}
            activePageId={activePageId}
            pages={pages}
            refreshPages={refreshPages}
          />
        ) : (
          <ActionsTab
            activeSetId={activeSetId}
            activePageId={activePageId}
            pages={pages}
            refreshPages={refreshPages}
          />
        )}
      </div>
    </div>
  );
}
