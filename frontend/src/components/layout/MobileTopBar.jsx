import { useAppState } from "../../state/useAppState.js";
import styles from "./MobileTopBar.module.css";

/**
 * Mobile-only top bar (hidden via CSS on desktop, not conditionally
 * rendered — see .module.css — so there's no layout shift right at the
 * breakpoint). Its hamburger button opens the Sidebar drawer by dispatching
 * to the same useAppState that Sidebar.jsx reads `isSidebarDrawerOpen` from.
 */
export default function MobileTopBar() {
  const { dispatch } = useAppState();

  return (
    <div className={styles.topBar}>
      <button
        className={styles.hamburgerButton}
        onClick={() => dispatch({ type: "OPEN_SIDEBAR_DRAWER" })}
        aria-label="Open sessions menu"
      >
        <span />
        <span />
        <span />
      </button>
      <h1 className={styles.title}>AMH Billing</h1>
    </div>
  );
}
