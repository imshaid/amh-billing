import { useEffect, useMemo, useRef, useState } from "react";
import { useAppState } from "../../state/useAppState.js";
import { useSets } from "../../hooks/useSets.js";
import { useSessionSummaries } from "../../hooks/useSessionSummaries.js";
import { useOrderedByPersons } from "../../hooks/useOrderedByPersons.js";
import { updateSet, deleteSet } from "../../db/sets.repository.js";
import ConfirmDialog from "../shared/ConfirmDialog.jsx";
import EditSessionModal from "./EditSessionModal.jsx";
import NewSessionModal from "../landing/NewSessionModal.jsx";
import styles from "./PreviousSessionsScreen.module.css";

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
function toBanglaDigits(n) {
  return String(n)
    .split("")
    .map((d) => BN_DIGITS[Number(d)] ?? d)
    .join("");
}

/** "১৫/৭/২০২৬" style, matching the date format already used elsewhere (see
 * DocumentHeader's তারিখ field) — day/month/year, Bangla digits. */
function formatDisplayDate(isoDate) {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("bn-BD", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(d);
}

/** "জুলাই ২০২৬" heading for a month-divider — calendar month, day 1 to
 * day 30/31, per the design decision behind this grouping (not a rolling
 * 30-day window). */
function formatMonthHeading(isoDate) {
  const d = new Date(isoDate);
  return new Intl.DateTimeFormat("bn-BD", {
    month: "long",
    year: "numeric",
  }).format(d);
}

/** Stable sort/group key ("2026-07") for a summary's displayDate, so two
 * dates in the same calendar month always land in the same group even
 * though `formatMonthHeading` re-derives the same label independently for
 * display — this key exists purely for grouping/ordering, never rendered. */
function monthKey(isoDate) {
  const d = new Date(isoDate);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** "৳১,৪২,০৫৫" style — Bangla digits, always shown (0 shown as "৳০" rather
 * than a bare dash) so a session with an as-yet-unfilled Bill page reads as
 * "zero so far", not as a missing/broken field. */
function formatAmount(total) {
  const safeTotal = total ?? 0;
  return `৳${toBanglaDigits(safeTotal.toLocaleString("en-US", { maximumFractionDigits: 0 }))}`;
}

/**
 * Full-screen browser for every Set, reached from the landing page's
 * "আগের সেশনসমূহ" card.
 *
 * Shows each session's buyer name, purchase date, total amount (from the
 * Set's Bill page), and who placed the order — all from
 * `useSessionSummaries`, which does the per-Set Page lookups this screen
 * itself has no reason to know about.
 *
 * Each row is a card: buyer name + amount on top, then a secondary
 * dot-separated meta line (date / ordered-by / page count), and a
 * three-dot overflow menu on the right for Edit/Delete — added per an
 * explicit design request, since a session's purchaseDate/orderedByPerson
 * (collected once at creation via NewSessionModal) previously had no way
 * to be corrected afterward, and there was no way to remove a session at
 * all from this screen.
 *
 * The overflow menu's own click needs `stopPropagation` — the card itself
 * is a button that opens the session (OPEN_SESSION), so without stopping
 * propagation, clicking the three-dot icon would both open the menu AND
 * navigate into the session underneath it.
 *
 * Edit opens EditSessionModal (purchaseDate/orderedByPerson only — not
 * Set.name, not buyer name, see that component's own doc comment) and
 * saves via `updateSet`. Delete always confirms first via the shared
 * ConfirmDialog (same as every other delete in this app — see
 * CanvasArea's page/line-item deletes) before calling `deleteSet`, which
 * now also cascades to delete every Page under that Set (see
 * db/sets.repository.js's own doc comment on why that cascade was added).
 *
 * Sessions are grouped under month-divider headings (calendar month, day 1
 * to day 30/31 — not a rolling 30-day window), using each session's
 * `displayDate` — see useSessionSummaries.js's own doc comment for that
 * field's purchaseDate → first-Invoice-date → createdAt fallback chain.
 *
 * Search filters client-side on `set.name` only — there's no dedicated
 * search index in Supabase and the expected number of Sets for a single
 * hotel's billing history doesn't call for one yet.
 *
 * Selecting a row (anywhere except the overflow menu) dispatches
 * OPEN_SESSION (same action LandingPage's "New Session" card uses) so both
 * paths land in WorkspaceView identically.
 */
export default function PreviousSessionsScreen() {
  const { dispatch } = useAppState();
  const {
    sets,
    status: setsStatus,
    refresh: refreshSets,
    createSet,
  } = useSets();
  const { summaries, status: summariesStatus } = useSessionSummaries(sets);
  const previousPersons = useOrderedByPersons(sets);
  const [query, setQuery] = useState("");
  const [openMenuSetId, setOpenMenuSetId] = useState(null);
  const [editingSet, setEditingSet] = useState(null);
  const [deletingSet, setDeletingSet] = useState(null);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!openMenuSetId) return;
    function handleClickOutside(e) {
      if (!menuRef.current?.contains(e.target)) setOpenMenuSetId(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuSetId]);

  const status =
    setsStatus === "error" || summariesStatus === "error"
      ? "error"
      : setsStatus === "ready" && summariesStatus === "ready"
        ? "ready"
        : "loading";

  const filteredSummaries = query.trim()
    ? summaries.filter((s) =>
        s.set.name.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : summaries;

  // Grouped as [{ key, heading, summaries }], most-recent month first.
  const groups = useMemo(() => {
    const byMonth = new Map();
    for (const summary of filteredSummaries) {
      const key = monthKey(summary.displayDate);
      if (!byMonth.has(key)) {
        byMonth.set(key, {
          key,
          heading: formatMonthHeading(summary.displayDate),
          summaries: [],
        });
      }
      byMonth.get(key).summaries.push(summary);
    }
    return Array.from(byMonth.values()).sort((a, b) =>
      b.key.localeCompare(a.key),
    );
  }, [filteredSummaries]);

  async function handleConfirmEdit({ purchaseDate, orderedByPerson }) {
    await updateSet(editingSet.id, { purchaseDate, orderedByPerson });
    setEditingSet(null);
    await refreshSets();
  }

  async function handleConfirmDelete() {
    await deleteSet(deletingSet.id);
    setDeletingSet(null);
    await refreshSets();
  }

  async function handleConfirmNewSession({ purchaseDate, orderedByPerson }) {
    const set = await createSet({
      name: `নতুন সেশন — ${new Date().toLocaleDateString("bn-BD")}`,
      purchaseDate,
      orderedByPerson,
    });
    setIsNewSessionModalOpen(false);
    dispatch({ type: "OPEN_SESSION", payload: set.id });
  }

  return (
    <div className={styles.screen}>
      <div className={styles.headerRow}>
        <h2 className={styles.heading}>আগের সেশনসমূহ</h2>
        <button
          type="button"
          className={styles.newSessionButton}
          onClick={() => setIsNewSessionModalOpen(true)}
        >
          + নতুন সেশন
        </button>
      </div>

      <input
        type="text"
        className={styles.searchInput}
        placeholder="সেশনের নাম দিয়ে খুঁজুন…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {status === "loading" && <p className={styles.emptyState}>লোড হচ্ছে…</p>}

      {status === "error" && (
        <p className={styles.emptyState}>সেশন লোড করা যায়নি।</p>
      )}

      {status === "ready" && groups.length === 0 && (
        <p className={styles.emptyState}>
          {query.trim()
            ? "কোনো মিল পাওয়া যায়নি।"
            : "এখনো কোনো সেশন তৈরি হয়নি।"}
        </p>
      )}

      {status === "ready" && groups.length > 0 && (
        <div className={styles.groupList}>
          {groups.map((group) => (
            <div key={group.key} className={styles.group}>
              <h3 className={styles.monthHeading}>{group.heading}</h3>
              <div className={styles.list}>
                {group.summaries.map(
                  ({
                    set,
                    buyerName,
                    total,
                    displayDate,
                    orderedByPerson,
                    pageCount,
                  }) => {
                    const formattedDate = formatDisplayDate(displayDate);
                    return (
                      <div key={set.id} className={styles.row}>
                        <button
                          type="button"
                          className={styles.rowClickArea}
                          onClick={() =>
                            dispatch({ type: "OPEN_SESSION", payload: set.id })
                          }
                        >
                          <div className={styles.rowTop}>
                            <span className={styles.rowName}>
                              {buyerName || set.name || "শিরোনামহীন সেশন"}
                            </span>
                            <span className={styles.rowAmount}>
                              {formatAmount(total)}
                            </span>
                          </div>
                          <div className={styles.rowMeta}>
                            {formattedDate && (
                              <span className={styles.rowMetaItem}>
                                {formattedDate}
                              </span>
                            )}
                            {orderedByPerson && (
                              <span className={styles.rowMetaItem}>
                                অর্ডার করেছেন: {orderedByPerson}
                              </span>
                            )}
                            <span className={styles.rowMetaItem}>
                              {toBanglaDigits(pageCount)} টি পেজ
                            </span>
                          </div>
                        </button>

                        <div
                          className={styles.menuWrapper}
                          ref={openMenuSetId === set.id ? menuRef : null}
                        >
                          <button
                            type="button"
                            className={styles.menuButton}
                            aria-label="আরও অপশন"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuSetId((current) =>
                                current === set.id ? null : set.id,
                              );
                            }}
                          >
                            ⋮
                          </button>
                          {openMenuSetId === set.id && (
                            <div className={styles.menuDropdown}>
                              <button
                                type="button"
                                className={styles.menuItem}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuSetId(null);
                                  setEditingSet(set);
                                }}
                              >
                                এডিট
                              </button>
                              <button
                                type="button"
                                className={styles.menuItemDanger}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuSetId(null);
                                  setDeletingSet(set);
                                }}
                              >
                                ডিলিট
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editingSet && (
        <EditSessionModal
          set={editingSet}
          previousPersons={previousPersons}
          onConfirm={handleConfirmEdit}
          onCancel={() => setEditingSet(null)}
        />
      )}

      {deletingSet && (
        <ConfirmDialog
          message={`"${deletingSet.name || "শিরোনামহীন সেশন"}" সেশনটি ডিলিট করবেন? এর সব বিল/চালান/সামারি পেজও মুছে যাবে। এই কাজ পূর্বাবস্থায় ফেরানো যাবে না।`}
          confirmLabel="ডিলিট"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingSet(null)}
        />
      )}

      {isNewSessionModalOpen && (
        <NewSessionModal
          previousPersons={previousPersons}
          onConfirm={handleConfirmNewSession}
          onCancel={() => setIsNewSessionModalOpen(false)}
        />
      )}
    </div>
  );
}
