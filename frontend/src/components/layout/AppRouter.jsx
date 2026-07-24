import { useRef, useState } from "react";
import { useAppState } from "../../state/useAppState.js";
import { useSets } from "../../hooks/useSets.js";
import { usePages } from "../../hooks/usePages.js";
import { useZoom } from "../../hooks/useZoom.js";
import { sortPagesForDisplay } from "../../domain/aggregation/pageSort.js";
import GlobalTopBar from "./GlobalTopBar.jsx";
import WorkspaceView from "./WorkspaceView.jsx";
import LandingPage from "../../features/landing/LandingPage.jsx";
import PreviousSessionsScreen from "../../features/session/PreviousSessionsScreen.jsx";
import PackagesScreen from "../../features/package-picker/PackagesScreen.jsx";
import PdfDownloadModal from "../../features/shared/PdfDownloadModal.jsx";
import styles from "./AppRouter.module.css";

/**
 * Top-level view router, mounted once Supabase bootstrap succeeds (see
 * App.jsx). GlobalTopBar renders once here, above whichever view is active,
 * so it stays persistent across every screen — including the Home button
 * that always returns to "landing" (see appReducer.js's GO_HOME action).
 *
 * `useSets` is called here (not inside GlobalTopBar itself) so the active
 * Set's name can be looked up and handed down as `activeSetName`.
 *
 * `usePages`/`useZoom`/the scroll-api ref now also live here rather than in
 * WorkspaceView, because GlobalTopBar's merged header (see its own doc
 * comment) needs the exact same `pages`/`zoom` state to render
 * PageCountNav/ZoomControl as WorkspaceView needs to render CanvasArea —
 * lifting it here means one `usePages` call feeds both instead of two
 * separate calls risking divergent copies of the same Pages array. Both
 * hooks are only meaningfully used while `currentView === "workspace"`;
 * `usePages(null)` when not in the workspace is a cheap no-op (see
 * usePages' own doc comment on the `setId` guard).
 */
export default function AppRouter() {
  const { state, dispatch } = useAppState();
  const { sets } = useSets();
  const scrollApiRef = useRef(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const isWorkspace = state.currentView === "workspace";
  const activeSet = state.activeSetId
    ? sets.find((s) => s.id === state.activeSetId)
    : null;

  const { pages, status, refresh } = usePages(
    isWorkspace ? state.activeSetId : null,
  );

  // Narrow screens start already zoomed out, rather than the user having to
  // manually zoom out from 100% on first load just to see the A4-fixed page
  // at all (see useZoom's own doc comment on why the page itself doesn't
  // reflow). 480px is a rough "phone-width" cutoff, not tied to
  // --breakpoint-mobile (768px) since this needs a narrower threshold than
  // the header's own layout breakpoint.
  const initialZoom =
    typeof window !== "undefined" && window.innerWidth < 480 ? 0.5 : 1;
  const {
    zoom,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoomPercent,
    zoomToFitWidth,
    zoomToFitHeight,
  } = useZoom(initialZoom);

  function handleJumpToPage(pageId) {
    dispatch({ type: "SET_ACTIVE_PAGE", payload: pageId });
    scrollApiRef.current?.scrollToPage(pageId);
  }

  function handleFitWidth() {
    const size = scrollApiRef.current?.getViewportSize();
    if (size) zoomToFitWidth(size.width);
  }

  function handleFitHeight() {
    const size = scrollApiRef.current?.getViewportSize();
    if (size) zoomToFitHeight(size.height);
  }

  return (
    <div className={styles.root}>
      <GlobalTopBar
        activeSetName={activeSet?.name}
        isWorkspace={isWorkspace}
        pages={pages}
        activePageId={state.activePageId}
        onJumpToPage={handleJumpToPage}
        zoom={zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onZoomReset={resetZoom}
        onSetZoomPercent={setZoomPercent}
        onFitWidth={handleFitWidth}
        onFitHeight={handleFitHeight}
        onOpenPdfDownload={() => setIsPdfModalOpen(true)}
      />

      {isPdfModalOpen && (
        <PdfDownloadModal
          // sortPagesForDisplay (the same canonical বিল → চালান → সামারি
          // order CanvasArea itself renders pages in) rather than the raw
          // `pages` from usePages — that raw order reflects Supabase
          // storage/creation order, not display order, which is exactly
          // what previously let a summary page end up ahead of its bill
          // in the generated PDF (see PdfDownloadModal.jsx's own doc
          // comment on the matching fix on its side).
          pages={sortPagesForDisplay(pages ?? [])}
          activeSetName={activeSet?.name}
          getPageElement={(pageId) =>
            scrollApiRef.current?.getPageElement(pageId) ?? null
          }
          onClose={() => setIsPdfModalOpen(false)}
        />
      )}

      <div className={isWorkspace ? styles.viewAreaNoScroll : styles.viewArea}>
        {state.currentView === "landing" && <LandingPage />}
        {isWorkspace && (
          <WorkspaceView
            activeSetId={state.activeSetId}
            activeSet={activeSet}
            pages={pages}
            status={status}
            refreshPages={refresh}
            zoom={zoom}
            registerScrollApi={(api) => {
              scrollApiRef.current = api;
            }}
          />
        )}
        {state.currentView === "previousSessions" && <PreviousSessionsScreen />}
        {state.currentView === "packages" && <PackagesScreen />}
      </div>
    </div>
  );
}
