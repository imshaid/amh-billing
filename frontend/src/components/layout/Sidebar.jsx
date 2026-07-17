import { useSets } from "../../hooks/useSets.js";
import { useAppState } from "../../state/useAppState.js";
import SetListItem from "./SetListItem.jsx";
import styles from "./Sidebar.module.css";

/**
 * Lists every Set and lets the user pick which one is active. On desktop
 * this renders as a fixed left column (see WorkspaceView's grid). On mobile
 * it's an off-canvas drawer toggled by GlobalTopBar's hamburger button,
 * tracked via `state.isSidebarDrawerOpen` in useAppState — the drawer's
 * open/closed class and the scrim are both driven by that one flag.
 *
 * "+ নতুন সেশন" is wired up to `createSet` here, but the actual session
 * creation *modal* (choosing how many Bill/Invoice/Summary pages) is a
 * separate not-yet-built feature (features/session/) — for now this creates
 * a bare, empty Set so the rest of the shell has something to select
 * against. Replace this handler's body once that modal exists.
 */
export default function Sidebar() {
  const { sets, status, createSet } = useSets();
  const { state, dispatch } = useAppState();

  async function handleCreateSet() {
    const set = await createSet({
      name: `নতুন সেশন — ${new Date().toLocaleDateString("bn-BD")}`,
    });
    dispatch({ type: "SET_ACTIVE_SET", payload: set.id });
    dispatch({ type: "CLOSE_SIDEBAR_DRAWER" });
  }

  function handleSelectSet(setId) {
    dispatch({ type: "SET_ACTIVE_SET", payload: setId });
    dispatch({ type: "CLOSE_SIDEBAR_DRAWER" });
  }

  return (
    <>
      {state.isSidebarDrawerOpen && (
        <div
          className={styles.scrim}
          onClick={() => dispatch({ type: "CLOSE_SIDEBAR_DRAWER" })}
        />
      )}

      <nav
        className={`${styles.sidebar} ${state.isSidebarDrawerOpen ? styles.sidebarOpen : ""}`}
        aria-label="সেশন তালিকা"
      >
        <div className={styles.header}>
          <h2 className={styles.title}>সেশনসমূহ</h2>
          <button className={styles.newSetButton} onClick={handleCreateSet}>
            + নতুন সেশন
          </button>
        </div>

        {status === "loading" && (
          <p className={styles.statusLine}>লোড হচ্ছে…</p>
        )}
        {status === "error" && (
          <p className={styles.statusLine}>সেশন লোড করা যায়নি।</p>
        )}

        {status === "ready" && sets.length === 0 && (
          <p className={styles.emptyState}>
            এখনো কোনো সেশন নেই। "+ নতুন সেশন" দিয়ে শুরু করুন।
          </p>
        )}

        {status === "ready" && sets.length > 0 && (
          <ul className={styles.list}>
            {sets.map((set) => (
              <SetListItem
                key={set.id}
                set={set}
                isActive={set.id === state.activeSetId}
                onSelect={() => handleSelectSet(set.id)}
              />
            ))}
          </ul>
        )}
      </nav>
    </>
  );
}
