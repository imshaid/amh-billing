import { useState } from "react";
import styles from "./PageCountNav.module.css";

const TYPE_LABELS = { bill: "বিল", invoice: "চালান", summary: "সামারি" };
const TYPE_ORDER = ["bill", "invoice", "summary"];

/**
 * Grouped page-count nav shown in the workspace top bar — "বিল ১ | চালান
 * ১-৩ | সামারি ১". All three type groups (bill/invoice/summary) always
 * render, even at zero pages — each group's button is also the only way to
 * add that page type, so it can never be hidden away. Clicking a group
 * opens a dropdown listing that type's pages by number (1, 2, 3...);
 * clicking a number scrolls the canvas to that page (see CanvasArea's
 * scroll-into-view ref map) and closes the dropdown. Each dropdown also has
 * a "+" to add another page of that type without leaving the top bar, per
 * the "all buttons at top" decision.
 *
 * @param {{
 *   pages: import('../../domain/models/Page.js').Page[]|null,
 *   activePageId: string|null,
 *   onJumpToPage: (pageId: string) => void,
 *   onAddPage: (type: "bill"|"invoice"|"summary") => void,
 * }} props
 */
export default function PageCountNav({
  pages,
  activePageId,
  onJumpToPage,
  onAddPage,
}) {
  const [openGroup, setOpenGroup] = useState(null);

  if (!pages) return null;

  const grouped = TYPE_ORDER.map((type) => ({
    type,
    label: TYPE_LABELS[type],
    pages: pages.filter((p) => p.type === type),
  }));

  return (
    <div className={styles.nav}>
      {grouped.map((group) => (
        <div key={group.type} style={{ position: "relative" }}>
          <button
            className={`${styles.groupButton} ${openGroup === group.type ? styles.groupButtonActive : ""}`}
            onClick={() =>
              setOpenGroup(openGroup === group.type ? null : group.type)
            }
          >
            {group.label}{" "}
            {group.pages.length > 0
              ? `১-${toBanglaDigits(group.pages.length)}`
              : "০"}
          </button>

          {openGroup === group.type && (
            <div className={styles.dropdown}>
              {group.pages.map((page, i) => (
                <button
                  key={page.id}
                  className={`${styles.dropdownItem} ${page.id === activePageId ? styles.dropdownItemActive : ""}`}
                  onClick={() => {
                    onJumpToPage(page.id);
                    setOpenGroup(null);
                  }}
                >
                  {toBanglaDigits(i + 1)}
                </button>
              ))}
              <button
                className={styles.addButton}
                onClick={() => {
                  onAddPage(group.type);
                  setOpenGroup(null);
                }}
              >
                + যোগ করুন
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
function toBanglaDigits(n) {
  return String(n)
    .split("")
    .map((d) => BN_DIGITS[Number(d)] ?? d)
    .join("");
}
