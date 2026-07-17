import { useAppState } from "../../state/useAppState.js";
import { usePages } from "../../hooks/usePages.js";
import Sidebar from "./Sidebar.jsx";
import MobileTopBar from "./MobileTopBar.jsx";
import CanvasArea from "./CanvasArea.jsx";
import BottomPanel from "./BottomPanel.jsx";
import styles from "./AppShell.module.css";

/**
 * The app's top-level workspace shell — everything the user sees once past
 * the dev bootstrap checkpoint in App.jsx. Composes:
 *   - Sidebar: list of Sets, pick which one is active (drawer on mobile)
 *   - MobileTopBar: hamburger trigger for the drawer, mobile only (CSS hides
 *     it on desktop rather than conditionally rendering, so there's no
 *     layout shift at the breakpoint)
 *   - CanvasArea: renders the active Page (Bill/Invoice/Summary preview)
 *   - BottomPanel: Packages/Actions tabs for editing the active Page
 *
 * `usePages` is called ONCE here, not separately inside CanvasArea and
 * BottomPanel. Reason: BottomPanel's PackagesTab writes a new LineItem to
 * IndexedDB when a package chip is clicked, and CanvasArea needs to reflect
 * that immediately (this is the "live editable preview... preview-ই আসল
 * output" requirement from the project notes). If each child called
 * `usePages` independently, they'd hold two separate copies of the same
 * data with no way for one write to notify the other's copy — so the single
 * `refresh()` from this one call is threaded down to whichever child
 * performs a write, and the resulting `pages` array is threaded down to
 * whichever child renders it.
 */
export default function AppShell() {
  const { state } = useAppState();
  const { pages, status, refresh } = usePages(state.activeSetId);

  return (
    <div className={styles.shell}>
      <MobileTopBar />
      <Sidebar />

      <div className={styles.mainColumn}>
        <CanvasArea
          activeSetId={state.activeSetId}
          activePageId={state.activePageId}
          pages={pages}
          status={status}
        />
        <BottomPanel
          activeSetId={state.activeSetId}
          activePageId={state.activePageId}
          pages={pages}
          refreshPages={refresh}
        />
      </div>
    </div>
  );
}
