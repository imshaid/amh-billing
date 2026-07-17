import { useRef } from "react";
import { useAppState } from "../../state/useAppState.js";
import { usePages } from "../../hooks/usePages.js";
import { addPage } from "../../db/pages.repository.js";
import { resyncSetPageOrder } from "../../db/sets.repository.js";
import PageCountNav from "./PageCountNav.jsx";
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
 * screen, not switching within this view. All controls live in the workspace
 * top strip: PageCountNav (grouped বিল/চালান/সামারি counts + jump dropdown +
 * add-page) and "শেষ করুন" (just returns to landing — GO_HOME — since every
 * edit already auto-saves via CanvasArea's debounced writes, there is
 * nothing left to persist on exit).
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

  async function handleAddPage(type) {
    if (!state.activeSetId) return;
    const page = await addPage({ setId: state.activeSetId, type });
    await resyncSetPageOrder(state.activeSetId);
    await refresh();
    // Scroll to the newly created page once it's rendered. A microtask
    // delay isn't enough here — CanvasArea needs to actually re-render with
    // the new page before its ref exists, so this waits a tick via
    // requestAnimationFrame rather than scrolling to a ref that isn't
    // registered yet.
    requestAnimationFrame(() => {
      dispatch({ type: "SET_ACTIVE_PAGE", payload: page.id });
      scrollApiRef.current?.scrollToPage(page.id);
    });
  }

  return (
    <div className={styles.shell}>
      <div className={styles.topStrip}>
        <PageCountNav
          pages={pages}
          activePageId={state.activePageId}
          onJumpToPage={(pageId) => {
            dispatch({ type: "SET_ACTIVE_PAGE", payload: pageId });
            scrollApiRef.current?.scrollToPage(pageId);
          }}
          onAddPage={handleAddPage}
        />
        <button
          className={styles.doneButton}
          onClick={() => dispatch({ type: "GO_HOME" })}
        >
          শেষ করুন
        </button>
      </div>

      <CanvasArea
        activeSetId={state.activeSetId}
        pages={pages}
        status={status}
        refreshPages={refresh}
        registerScrollApi={(api) => {
          scrollApiRef.current = api;
        }}
      />
    </div>
  );
}
