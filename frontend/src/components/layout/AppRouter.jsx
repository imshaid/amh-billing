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
 * Set's name can be looked up and handed down as `activeSetName` — this is
 * the only place in the tree that needs a Set's *name* by itself; the
 * workspace only needs `activeSetId` (see WorkspaceView, which reads pages
 * via that id, not the Set object).
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
