import { useMemo, useState } from "react";
import { useAppState } from "../../state/useAppState.js";
import { useSets } from "../../hooks/useSets.js";
import { useSessionSummaries } from "../../hooks/useSessionSummaries.js";
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

function formatAmount(total) {
  if (total == null) return null;
  return toBanglaDigits(
    total.toLocaleString("en-US", { maximumFractionDigits: 0 }),
  );
}

/**
 * Full-screen browser for every Set, reached from the landing page's
 * "আগের সেশনসমূহ" card.
 *
 * Redesigned per an explicit design request to show each session's actual
 * billing context — buyer name, purchase date, total amount (from the
 * Set's Bill page), and who placed the order — instead of just the Set's
 * bare name and page count. All of that comes from `useSessionSummaries`,
 * which does the per-Set Page lookups this screen itself has no reason to
 * know about.
 *
 * Sessions are grouped under month-divider headings (calendar month, day 1
 * to day 30/31 — not a rolling 30-day window), using each session's
 * `displayDate` — see useSessionSummaries.js's own doc comment for that
 * field's purchaseDate → first-Invoice-date → createdAt fallback chain.
 * Groups are ordered most-recent-month-first, matching `useSets`'s overall
 * most-recently-updated-first convention; within a month, sessions keep
 * whatever order `useSets`/`useSessionSummaries` already produced (also
 * recency, via `updatedAt`) rather than being re-sorted by displayDate,
 * since displayDate is a mix of purchase/invoice/created dates and isn't
 * reliably comparable enough to be a good *within-group* sort key too.
 *
 * Search filters client-side on `set.name` only, same as before — there's
 * no dedicated search index in IndexedDB (see db/schema.js) and the
 * expected number of Sets for a single hotel's billing history doesn't
 * call for one yet.
 *
 * Selecting a row dispatches OPEN_SESSION (same action LandingPage's "New
 * Session" card uses) so both paths land in WorkspaceView identically.
 */
export default function PreviousSessionsScreen() {
  const { dispatch } = useAppState();
  const { sets, status: setsStatus } = useSets();
  const { summaries, status: summariesStatus } = useSessionSummaries(sets);
  const [query, setQuery] = useState("");

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
                  }) => (
                    <button
                      key={set.id}
                      className={styles.row}
                      onClick={() =>
                        dispatch({ type: "OPEN_SESSION", payload: set.id })
                      }
                    >
                      <div className={styles.rowMain}>
                        <span className={styles.rowName}>
                          {buyerName || set.name || "শিরোনামহীন সেশন"}
                        </span>
                        <span className={styles.rowDate}>
                          {formatDisplayDate(displayDate)}
                        </span>
                      </div>
                      <div className={styles.rowDetails}>
                        {orderedByPerson && (
                          <span className={styles.rowDetail}>
                            অর্ডার করেছেন: {orderedByPerson}
                          </span>
                        )}
                        <span className={styles.rowDetail}>
                          {toBanglaDigits(pageCount)} টি পেজ
                        </span>
                      </div>
                      <span className={styles.rowAmount}>
                        {total != null ? `৳${formatAmount(total)}` : "—"}
                      </span>
                    </button>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
