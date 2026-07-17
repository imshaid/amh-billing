import { useState } from "react";
import styles from "./PageCountNav.module.css";

const TYPE_LABELS = { bill: "বিল", invoice: "চালান", summary: "সামারি" };
const TYPE_ORDER = ["bill", "invoice", "summary"];

/**
 * Grouped page-count nav shown in the workspace top bar — "বিল ১ | চালান ৩
 * | সামারি ১". Navigation only now — adding a page moved to PageActionBar,
 * rendered below each page in CanvasArea, since every new page duplicates a
 * specific existing page and needs to be anchored to one. All three type
 * groups always render, even at zero pages, so counts stay visible at a
 * glance. Clicking a group opens a dropdown listing that type's pages by
 * number (1, 2, 3...); clicking a number scrolls the canvas to that page
 * (see CanvasArea's scroll-into-view ref map) and closes the dropdown.
 *
 * The count label is just the page count ("বিল ৩"), not a range — a range
 * like "১-৩" reads oddly at count 1 ("১-১") and doesn't carry more meaning
 * than a plain count would for this UI.
 *
 * @param {{
 *   pages: import('../../domain/models/Page.js').Page[]|null,
 *   activePageId: string|null,
 *   onJumpToPage: (pageId: string) => void,
 * }} props
 */
export default function PageCountNav({ pages, activePageId, onJumpToPage }) {
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
        <div key={group.type} className={styles.groupWrapper}>
          <button
            className={`${styles.groupButton} ${openGroup === group.type ? styles.groupButtonActive : ""}`}
            onClick={() =>
              setOpenGroup(openGroup === group.type ? null : group.type)
            }
          >
            {group.label} {toBanglaDigits(group.pages.length)}
          </button>

          {openGroup === group.type && group.pages.length > 0 && (
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
