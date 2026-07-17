import { useState } from "react";
import { useAppState } from "../../state/useAppState.js";
import { useSets } from "../../hooks/useSets.js";
import styles from "./PreviousSessionsScreen.module.css";

/**
 * Full-screen browser for every Set, reached from the landing page's
 * "আগের সেশনসমূহ" card. `useSets` already sorts by `updatedAt` descending
 * (see hooks/useSets.js), so the most recently touched session naturally
 * appears first without this screen doing any sorting of its own.
 *
 * Search filters client-side on `set.name` only — there's no dedicated
 * search index in IndexedDB (see db/schema.js) and the expected number of
 * Sets for a single hotel's billing history doesn't call for one yet. If
 * that stops being true, this is the first place that would need a real
 * query instead of `.filter()`.
 *
 * Selecting a row dispatches OPEN_SESSION (same action LandingPage's "New
 * Session" card uses) so both paths land in WorkspaceView identically.
 */
export default function PreviousSessionsScreen() {
  const { dispatch } = useAppState();
  const { sets, status } = useSets();
  const [query, setQuery] = useState("");

  const filteredSets = query.trim()
    ? sets.filter((set) =>
        set.name.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : sets;

  return (
    <div className={styles.screen}>
      <h2 className={styles.heading}>আগের সেশনসমূহ</h2>

      <input
        type="text"
        className={styles.searchInput}
        placeholder="সেশনের নাম দিয়ে খুঁজুন…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {status === "loading" && <p className={styles.emptyState}>লোড হচ্ছে…</p>}

      {status === "ready" && filteredSets.length === 0 && (
        <p className={styles.emptyState}>
          {query.trim()
            ? "কোনো মিল পাওয়া যায়নি।"
            : "এখনো কোনো সেশন তৈরি হয়নি।"}
        </p>
      )}

      {status === "ready" && filteredSets.length > 0 && (
        <div className={styles.list}>
          {filteredSets.map((set) => (
            <button
              key={set.id}
              className={styles.row}
              onClick={() =>
                dispatch({ type: "OPEN_SESSION", payload: set.id })
              }
            >
              <span className={styles.rowName}>
                {set.name || "শিরোনামহীন সেশন"}
              </span>
              <span className={styles.rowMeta}>
                {set.pageIds.length} টি পেজ
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
