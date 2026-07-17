import { useAppState } from "../../state/useAppState.js";
import styles from "./GlobalTopBar.module.css";

/**
 * Persistent top bar shown on every screen (landing, workspace, previous
 * sessions, packages, analytics). The "আদর্শ মুন্সির হোটেল — বিলিং" title
 * doubles as the Home button on every screen (GO_HOME).
 *
 * No hamburger/drawer here anymore — the workspace no longer has a Sidebar
 * (see WorkspaceView's doc comment: only one Set is ever open at a time,
 * switching Sets means returning to the landing page's Previous Sessions
 * screen). WorkspaceView's own top strip (PageCountNav + শেষ করুন) handles
 * everything that used to require a drawer trigger.
 *
 * @param {{ activeSetName?: string|null }} props
 */
export default function GlobalTopBar({ activeSetName }) {
  const { state, dispatch } = useAppState();

  return (
    <div className={styles.topBar}>
      <button
        className={styles.homeButton}
        onClick={() => dispatch({ type: "GO_HOME" })}
      >
        <h1 className={styles.title}>আদর্শ মুন্সির হোটেল — বিলিং</h1>
      </button>

      {state.currentView === "workspace" && activeSetName && (
        <span className={styles.activeSessionName}>{activeSetName}</span>
      )}
    </div>
  );
}
