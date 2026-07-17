import { useAppState } from "../../state/useAppState.js";
import { useSets } from "../../hooks/useSets.js";
import FeatureCard from "./FeatureCard.jsx";
import styles from "./LandingPage.module.css";

/**
 * Home screen — the first thing the user sees, and where GlobalTopBar's
 * title/Home button always returns to. Purely a router: each card's only
 * job is to send the user to one of the other top-level views (workspace,
 * previousSessions, packages, analytics), never to show session data
 * itself. See docs/data-model.md for the underlying Set/Page shape that the
 * destination views operate on.
 *
 * "নতুন সেশন" creates a bare Set the same way Sidebar's own button used to
 * (see Sidebar.jsx's doc comment — the real session-creation modal in
 * features/session/ is still not built) and jumps straight into the
 * workspace with it active via OPEN_SESSION, skipping the extra step of
 * landing in the workspace with nothing selected.
 *
 * "আগের সেশনসমূহ" and "প্যাকেজ" route to features/session/ and a package
 * manager respectively — both still unbuilt, so for now they just switch
 * `currentView`; when their screens exist they'll read `state.currentView`
 * the same way WorkspaceView already does, no change needed here.
 */
export default function LandingPage() {
  const { dispatch } = useAppState();
  const { createSet } = useSets();

  async function handleNewSession() {
    const set = await createSet({
      name: `নতুন সেশন — ${new Date().toLocaleDateString("bn-BD")}`,
    });
    dispatch({ type: "OPEN_SESSION", payload: set.id });
  }

  return (
    <div className={styles.landing}>
      <h2 className={styles.heading}>আপনি কী করতে চান?</h2>

      <div className={styles.grid}>
        <FeatureCard
          icon="📄"
          title="নতুন সেশন"
          description="নতুন বিল বা চালান তৈরি শুরু করুন"
          onClick={handleNewSession}
        />
        <FeatureCard
          icon="🕐"
          title="আগের সেশনসমূহ"
          description="পুরনো সেশন খুঁজুন ও চালিয়ে যান"
          onClick={() =>
            dispatch({ type: "SET_VIEW", payload: "previousSessions" })
          }
        />
        <FeatureCard
          icon="📦"
          title="প্যাকেজ"
          description="মেনু প্যাকেজ দেখুন ও সম্পাদনা করুন"
          onClick={() => dispatch({ type: "SET_VIEW", payload: "packages" })}
        />
        <FeatureCard
          icon="📊"
          title="অ্যানালিটিক্স"
          description="সেশন ও আয়ের সারসংক্ষেপ"
          onClick={() => dispatch({ type: "SET_VIEW", payload: "analytics" })}
        />
      </div>
    </div>
  );
}
