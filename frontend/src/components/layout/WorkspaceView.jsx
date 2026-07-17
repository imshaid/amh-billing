import { useAppState } from "../../state/useAppState.js";
import { usePages } from "../../hooks/usePages.js";
import Sidebar from "./Sidebar.jsx";
import CanvasArea from "./CanvasArea.jsx";
import BottomPanel from "./BottomPanel.jsx";
import styles from "./WorkspaceView.module.css";

/**
 * The Bill/Invoice editing workspace — one of the top-level views reachable
 * from the landing page's grid (see App.jsx for the view router). Composes:
 *   - Sidebar: list of Sets, pick which one is active (drawer on mobile)
 *   - CanvasArea: renders the active Page (Bill/Invoice/Summary preview)
 *   - BottomPanel: Packages/Actions tabs for editing the active Page
 *
 * GlobalTopBar (hamburger + Home button) is rendered by App.jsx above this
 * component, not inside it — it's persistent across every view, not just
 * this one. This used to be a self-contained "AppShell" rendered directly
 * from App.jsx; it's now one of five sibling views (landing, workspace,
 * previousSessions, packages, analytics) selected by `state.currentView`.
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
export default function WorkspaceView() {
  const { state } = useAppState();
  const { pages, status, refresh } = usePages(state.activeSetId);

  return (
    <div className={styles.shell}>
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
