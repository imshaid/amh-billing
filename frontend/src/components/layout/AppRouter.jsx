import { useAppState } from "../../state/useAppState.js";
import { useSets } from "../../hooks/useSets.js";
import GlobalTopBar from "./GlobalTopBar.jsx";
import WorkspaceView from "./WorkspaceView.jsx";
import LandingPage from "../../features/landing/LandingPage.jsx";
import PreviousSessionsScreen from "../../features/session/PreviousSessionsScreen.jsx";
import PackagesScreen from "../../features/package-picker/PackagesScreen.jsx";
import AnalyticsScreen from "../../features/analytics/AnalyticsScreen.jsx";
import styles from "./AppRouter.module.css";

/**
 * Top-level view router, mounted once IndexedDB bootstrap succeeds (see
 * App.jsx). GlobalTopBar renders once here, above whichever view is active,
 * so it stays persistent across every screen — including the Home button
 * that always returns to "landing" (see appReducer.js's GO_HOME action).
 *
 * `useSets` is called here (not inside GlobalTopBar itself) so the active
 * Set's name can be looked up and handed down as `activeSetName` — this
 * avoids GlobalTopBar needing its own IndexedDB read just to display a name
 * that WorkspaceView's own Sidebar has *also* already loaded via its own
 * `useSets` call. Two `useSets` calls across the tree still means two
 * separate loads of the same store, but Sets are small, rarely change, and
 * `usePackages`-style hoisting all the way to AppRouter would mean drilling
 * the list down through WorkspaceView -> Sidebar for no real benefit — this
 * is a smaller, one-directional read (name lookup only), not a shared
 * read-then-write flow like the `usePages` case in WorkspaceView.
 */
export default function AppRouter() {
  const { state } = useAppState();
  const { sets } = useSets();

  const activeSet = state.activeSetId
    ? sets.find((s) => s.id === state.activeSetId)
    : null;

  return (
    <div className={styles.root}>
      <GlobalTopBar activeSetName={activeSet?.name} />

      <div
        className={
          state.currentView === "workspace"
            ? styles.viewAreaNoScroll
            : styles.viewArea
        }
      >
        {state.currentView === "landing" && <LandingPage />}
        {state.currentView === "workspace" && <WorkspaceView />}
        {state.currentView === "previousSessions" && <PreviousSessionsScreen />}
        {state.currentView === "packages" && <PackagesScreen />}
        {state.currentView === "analytics" && <AnalyticsScreen />}
      </div>
    </div>
  );
}
