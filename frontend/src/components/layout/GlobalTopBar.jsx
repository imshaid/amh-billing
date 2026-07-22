import { useAppState } from "../../state/useAppState.js";
import { useMediaQuery } from "../../hooks/useMediaQuery.js";
import PageCountNav from "./PageCountNav.jsx";
import ZoomControl from "./ZoomControl.jsx";
import styles from "./GlobalTopBar.module.css";

// NOTE: literal copy of --breakpoint-mobile (see tokens.css) — CSS custom
// properties aren't readable from a matchMedia string, so this stays a
// plain number kept in sync with that token by convention, same as the
// other `@media (max-width: 768px)` rules already scattered across this
// component's own module.css and PageCountNav/WorkspaceView's.
const NARROW_QUERY = "(max-width: 768px)";

/**
 * The single persistent header shown on every screen (landing, workspace,
 * previous sessions, packages, analytics).
 *
 * On desktop-width screens this renders as one 3-slot bar (home | page
 * nav+zoom | finish), laid out with CSS grid so the center group stays
 * visually centered regardless of how wide the left/right slots are.
 *
 * On narrow screens (≤768px) it splits into two stacked rows instead, per
 * an explicit design request — there simply isn't enough width on a phone
 * for the home button, session name, page nav, zoom controls, and
 * "শেষ করুন" all on one line without everything getting cramped:
 *   - Top row: home button + session name + "শেষ করুন".
 *   - Bottom row: PageCountNav + ZoomControl, full-width and centered on
 *     their own.
 * This is a real conditional render driven by `useMediaQuery` (not two
 * copies of the center group shown/hidden via CSS) — PageCountNav and
 * ZoomControl each carry their own internal state (ZoomControl's dropdown
 * open/closed, PageCountNav's open group), so mounting both a "wide" and a
 * "narrow" copy at once would double their event listeners and let their
 * states drift out of sync with each other. Only one copy of the center
 * group ever exists at a time; `useMediaQuery` just decides which slot it
 * renders into.
 *
 * Center/right content is workspace-only either way: PageCountNav/
 * ZoomControl/"শেষ করুন" are workspace concepts, so they're simply omitted
 * (not rendered empty/disabled) on every other screen.
 *
 * All of PageCountNav/ZoomControl's data and handlers are passed down from
 * AppRouter (which owns `usePages`/`useZoom`/the scroll-api ref) rather
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
 *   onSetZoomPercent?: (percent: number) => void,
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
  onSetZoomPercent,
  onFitWidth,
  onFitHeight,
}) {
  const { dispatch } = useAppState();
  const isNarrow = useMediaQuery(NARROW_QUERY);

  const centerGroup = isWorkspace && (
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
        onSetZoomPercent={onSetZoomPercent}
        onFitWidth={onFitWidth}
        onFitHeight={onFitHeight}
      />
    </div>
  );

  return (
    <div className={styles.topBar}>
      <div className={styles.topRow}>
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

        {/* Only rendered here (the single-bar layout) on wide screens —
            on narrow screens this slot stays empty and the same
            `centerGroup` renders in `.bottomRow` below instead. */}
        {!isNarrow && centerGroup}

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

      {isNarrow && isWorkspace && (
        <div className={styles.bottomRow}>{centerGroup}</div>
      )}
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
