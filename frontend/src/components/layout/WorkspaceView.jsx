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
 * This component used to own its own top strip (PageCountNav + ZoomControl
 * + "শেষ করুন") in addition to CanvasArea. That strip has since merged into
 * the single persistent GlobalTopBar (see AppRouter.jsx and
 * GlobalTopBar.jsx), so the app shows exactly one header everywhere instead
 * of two stacked bars. `usePages`/`useZoom`/the scroll-api ref have moved up
 * to AppRouter accordingly — it's the one place both GlobalTopBar (which
 * renders PageCountNav/ZoomControl from this data) and WorkspaceView (which
 * renders CanvasArea from the same data) both need it, so lifting it there
 * avoids two separate `usePages` calls holding divergent copies of the same
 * Pages array. WorkspaceView itself is now just a thin CanvasArea wrapper —
 * everything is passed in as props instead of fetched here.
 *
 * @param {{
 *   activeSetId: string|null,
 *   pages: import('../../domain/models/Page.js').Page[]|null,
 *   status: "idle"|"loading"|"ready"|"error",
 *   refreshPages: () => Promise<void>,
 *   zoom: number,
 *   registerScrollApi: (api: object) => void,
 * }} props
 */
export default function WorkspaceView({
  activeSetId,
  pages,
  status,
  refreshPages,
  zoom,
  registerScrollApi,
}) {
  return (
    <div className={styles.shell}>
      <CanvasArea
        activeSetId={activeSetId}
        pages={pages}
        status={status}
        refreshPages={refreshPages}
        zoom={zoom}
        registerScrollApi={registerScrollApi}
      />
    </div>
  );
}
