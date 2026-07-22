import { useAppState } from "../../state/useAppState.js";
import PageCountNav from "./PageCountNav.jsx";
import ZoomControl from "./ZoomControl.jsx";
import styles from "./GlobalTopBar.module.css";

/**
 * The single persistent header shown on every screen (landing, workspace,
 * previous sessions, packages, analytics) — a 3-slot bar (home | page
 * nav+zoom | finish) laid out with CSS grid so the center group stays
 * visually centered regardless of how wide the left/right slots are.
 *
 * This used to be two stacked bars: this file (title text doubling as a
 * Home button, plus the active Set's name) sitting above WorkspaceView's
 * own top strip (PageCountNav + ZoomControl + "শেষ করুন"). Per an explicit
 * design request, those merged into one bar:
 *   - Left: icon-only Home button (no title text — see `HomeIcon` below).
 *     Always present, on every screen.
 *   - Center: PageCountNav (বিল/চালান/সামারি counts + jump dropdown) next
 *     to ZoomControl (zoom in/out/reset + fit-width/fit-height). Both are
 *     workspace-only concepts, so this whole group is simply omitted (not
 *     rendered empty/disabled) on every other screen — the grid's center
 *     column just collapses to nothing and the left/right slots keep their
 *     own position via `justify-self`, so there's no lopsided gap.
 *   - Right: "শেষ করুন" (finish/done), workspace-only for the same reason —
 *     every edit already auto-saves via CanvasArea's debounced writes, so
 *     leaving the workspace has nothing left to persist.
 *
 * All of PageCountNav/ZoomControl's data and handlers are passed down from
 * AppRouter (which now owns `usePages`/`useZoom`/the scroll-api ref) rather
 * than fetched here, since CanvasArea inside WorkspaceView needs the exact
 * same `pages`/`zoom` state — see AppRouter.jsx's doc comment.
 *
 * @param {{
 *   activeSetName?: string|null,
 *   isWorkspace: boolean,
 *   pages?: import('../../domain/models/Page.js').Page[]|null,
 *   activePageId?: string|null,
 *   onJumpToPage?: (pageId: string) => void,
 *   zoom?: number,
 *   onZoomIn?: () => void,
 *   onZoomOut?: () => void,
 *   onZoomReset?: () => void,
 *   onFitWidth?: () => void,
 *   onFitHeight?: () => void,
 * }} props
 */
export default function GlobalTopBar({
  activeSetName,
  isWorkspace,
  pages,
  activePageId,
  onJumpToPage,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onFitWidth,
  onFitHeight,
}) {
  const { dispatch } = useAppState();

  return (
    <div className={styles.topBar}>
      <div className={styles.leftSlot}>
        <button
          type="button"
          className={styles.homeButton}
          onClick={() => dispatch({ type: "GO_HOME" })}
          aria-label="হোম"
          title="হোম"
        >
          <HomeIcon />
        </button>
        {isWorkspace && activeSetName && (
          <span className={styles.activeSessionName}>{activeSetName}</span>
        )}
      </div>

      {isWorkspace && (
        <div className={styles.centerSlot}>
          <PageCountNav
            pages={pages}
            activePageId={activePageId}
            onJumpToPage={onJumpToPage}
          />
          <ZoomControl
            zoom={zoom}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onReset={onZoomReset}
            onFitWidth={onFitWidth}
            onFitHeight={onFitHeight}
          />
        </div>
      )}

      <div className={styles.rightSlot}>
        {isWorkspace && (
          <button
            type="button"
            className={styles.doneButton}
            onClick={() => dispatch({ type: "GO_HOME" })}
          >
            শেষ করুন
          </button>
        )}
      </div>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1h3.5v-6h4v6H17a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}
