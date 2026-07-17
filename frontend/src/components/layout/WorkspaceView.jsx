import { useRef } from "react";
import { useAppState } from "../../state/useAppState.js";
import { usePages } from "../../hooks/usePages.js";
import { useZoom } from "../../hooks/useZoom.js";
import PageCountNav from "./PageCountNav.jsx";
import ZoomControl from "./ZoomControl.jsx";
import CanvasArea from "./CanvasArea.jsx";
import styles from "./WorkspaceView.module.css";

/**
 * The Bill/Invoice editing workspace — one of the top-level views reachable
 * from the landing page's grid (see App.jsx for the view router).
 *
 * Redesigned as a single continuous-scroll canvas (Chrome-PDF-viewer style)
 * rather than Sidebar + CanvasArea + BottomPanel: there is no page/session
 * list UI here at all — only the one Set the user opened (via "নতুন সেশন" or
 * "আগের সেশনসমূহ" on the landing page) is ever shown, and returning to a
 * *different* Set means going back to the landing page's Previous Sessions
 * screen, not switching within this view.
 *
 * The top strip holds PageCountNav (grouped বিল/চালান/সামারি counts + jump
 * dropdown — navigation, not creation), ZoomControl (pages stay fixed at
 * real A4 size — see useZoom's doc comment — so small screens zoom out
 * rather than the layout reflowing), and "শেষ করুন" (returns to landing;
 * every edit already auto-saves via CanvasArea's debounced writes, so there
 * is nothing left to persist on exit). Adding a page lives in
 * PageActionBar, rendered below each page in CanvasArea — every new page
 * duplicates a specific existing page, so the action needs to be anchored
 * to one; the one exception is the very first page in an empty Set, which
 * CanvasArea's own empty-state offers directly since there is nothing yet
 * to duplicate from.
 *
 * `usePages` is called ONCE here, not inside CanvasArea, so a write from
 * inline editing or the package-picker popup (both happen inside
 * CanvasArea) can call `refresh()` and have the update reflected without a
 * second component holding a stale copy of the same Pages array.
 */
export default function WorkspaceView() {
  const { state, dispatch } = useAppState();
  const { pages, status, refresh } = usePages(state.activeSetId);
  const scrollApiRef = useRef(null);

  // Narrow screens start already zoomed out, rather than the user having to
  // manually zoom out from 100% on first load just to see the A4-fixed page
  // at all (see useZoom's own doc comment on why the page itself doesn't
  // reflow). 480px is a rough "phone-width" cutoff, not tied to
  // --breakpoint-mobile (768px) since this needs a narrower threshold than
  // the sidebar/topbar layout breakpoint.
  const initialZoom =
    typeof window !== "undefined" && window.innerWidth < 480 ? 0.5 : 1;
  const { zoom, zoomIn, zoomOut, resetZoom } = useZoom(initialZoom);

  return (
    <div className={styles.shell}>
      <div className={styles.topStrip}>
        <div className={styles.navSlot}>
          <PageCountNav
            pages={pages}
            activePageId={state.activePageId}
            onJumpToPage={(pageId) => {
              dispatch({ type: "SET_ACTIVE_PAGE", payload: pageId });
              scrollApiRef.current?.scrollToPage(pageId);
            }}
          />
        </div>
        <div className={styles.rightSlot}>
          <ZoomControl
            zoom={zoom}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onReset={resetZoom}
          />
          <button
            className={styles.doneButton}
            onClick={() => dispatch({ type: "GO_HOME" })}
          >
            শেষ করুন
          </button>
        </div>
      </div>

      <CanvasArea
        activeSetId={state.activeSetId}
        pages={pages}
        status={status}
        refreshPages={refresh}
        zoom={zoom}
        registerScrollApi={(api) => {
          scrollApiRef.current = api;
        }}
      />
    </div>
  );
}
