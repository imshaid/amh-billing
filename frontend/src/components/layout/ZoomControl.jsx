import { useState, useRef, useEffect } from "react";
import { ZOOM_LEVEL_PERCENTAGES } from "../../hooks/useZoom.js";
import styles from "./ZoomControl.module.css";

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
function toBanglaDigits(n) {
  return String(n)
    .split("")
    .map((d) => BN_DIGITS[Number(d)] ?? d)
    .join("");
}

/**
 * Zoom in/out/reset controls for the canvas — addresses "pages not properly
 * fit on small devices, also not have any zoom options". +/- step by 10%
 * (see useZoom's STEP); the percentage label itself now has two roles per
 * an explicit design request:
 *   - A single click opens a dropdown of fixed zoom-level shortcuts (25%,
 *     50%, ..., 200% — see ZOOM_LEVEL_PERCENTAGES, a 25%-interval list
 *     spanning useZoom's own MIN_ZOOM/MAX_ZOOM range) so the user can jump
 *     straight to a level instead of stepping there one +/- click at a
 *     time.
 *   - A double-click still resets straight to 100%, same as the old
 *     single-click behavior, kept for anyone used to that shortcut.
 * Clicking a dropdown item, clicking anywhere else on the page, or
 * pressing Escape all close it.
 *
 * `onFitWidth`/`onFitHeight` are optional — when provided, two extra icon
 * buttons render after the zoom-in button, matching the fit-width/fit-page
 * options in a typical PDF viewer's zoom menu. Omitted entirely (not
 * rendered as disabled) when the caller doesn't pass them, so this
 * component still works standalone without a measurable container.
 *
 * @param {{
 *   zoom: number,
 *   onZoomIn: () => void,
 *   onZoomOut: () => void,
 *   onReset: () => void,
 *   onSetZoomPercent: (percent: number) => void,
 *   onFitWidth?: () => void,
 *   onFitHeight?: () => void,
 * }} props
 */
export default function ZoomControl({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  onSetZoomPercent,
  onFitWidth,
  onFitHeight,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleOutside(e) {
      if (!wrapperRef.current?.contains(e.target)) setIsOpen(false);
    }
    function handleEscape(e) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const currentPercent = Math.round(zoom * 100);

  return (
    <div className={styles.control}>
      <button
        type="button"
        className={styles.button}
        onClick={onZoomOut}
        aria-label="ছোট করুন"
      >
        −
      </button>

      <div className={styles.levelWrapper} ref={wrapperRef}>
        <button
          type="button"
          className={styles.level}
          onClick={() => setIsOpen((v) => !v)}
          onDoubleClick={() => {
            setIsOpen(false);
            onReset();
          }}
          title="জুম লেভেল বেছে নিন (ডাবল-ক্লিকে ১০০%)"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          {toBanglaDigits(currentPercent)}%
        </button>

        {isOpen && (
          <ul className={styles.dropdown} role="listbox">
            {ZOOM_LEVEL_PERCENTAGES.map((percent) => (
              <li key={percent}>
                <button
                  type="button"
                  role="option"
                  aria-selected={percent === currentPercent}
                  className={`${styles.dropdownItem} ${
                    percent === currentPercent ? styles.dropdownItemActive : ""
                  }`}
                  onClick={() => {
                    onSetZoomPercent(percent);
                    setIsOpen(false);
                  }}
                >
                  {toBanglaDigits(percent)}%
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        className={styles.button}
        onClick={onZoomIn}
        aria-label="বড় করুন"
      >
        +
      </button>
      {(onFitWidth || onFitHeight) && (
        <span className={styles.divider} aria-hidden="true" />
      )}
      {onFitWidth && (
        <button
          type="button"
          className={styles.fitButton}
          onClick={onFitWidth}
          title="প্রস্থ অনুযায়ী ফিট করুন"
          aria-label="প্রস্থ অনুযায়ী ফিট করুন"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 8v8" />
            <path d="M21 8v8" />
            <path d="M7 12h10" />
            <path d="M15 9l3 3-3 3" />
            <path d="M9 9l-3 3 3 3" />
          </svg>
        </button>
      )}
      {onFitHeight && (
        <button
          type="button"
          className={styles.fitButton}
          onClick={onFitHeight}
          title="উচ্চতা অনুযায়ী ফিট করুন"
          aria-label="উচ্চতা অনুযায়ী ফিট করুন"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 3h8" />
            <path d="M8 21h8" />
            <path d="M12 7v10" />
            <path d="M9 15l3 3 3-3" />
            <path d="M9 9l3-3 3 3" />
          </svg>
        </button>
      )}
    </div>
  );
}
