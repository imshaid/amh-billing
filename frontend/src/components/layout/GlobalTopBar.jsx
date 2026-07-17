import { useAppState } from "../../state/useAppState.js";
import styles from "./GlobalTopBar.module.css";

/**
 * Persistent top bar shown on every screen (landing, workspace, previous
 * sessions, packages, analytics) — not just mobile. This replaces the
 * earlier mobile-only MobileTopBar: the "AMH Billing" title now doubles as
 * the Home button on every breakpoint (per the decision to make Home
 * always-visible rather than tucked into the Sidebar), and the hamburger
 * (still mobile-only, still opens the Sidebar drawer) lives here instead of
 * its own component since both belong to the same persistent strip.
 *
 * The active session name only renders while `currentView === "workspace"`
 * and a Set is actually selected — on "landing" there's nothing to show,
 * and showing a stale name on other screens (previousSessions/packages/
 * analytics) would misleadingly imply that Set is still "current".
 *
 * @param {{ activeSetName?: string|null }} props
 */
export default function GlobalTopBar({ activeSetName }) {
  const { state, dispatch } = useAppState();

  return (
    <div className={styles.topBar}>
      {state.currentView === "workspace" && (
        <button
          className={styles.hamburgerButton}
          onClick={() => dispatch({ type: "OPEN_SIDEBAR_DRAWER" })}
          aria-label="সেশন তালিকা খুলুন"
        >
          <span />
          <span />
          <span />
        </button>
      )}

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
