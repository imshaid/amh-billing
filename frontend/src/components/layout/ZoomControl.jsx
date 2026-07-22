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
 * fit on small devices, also not have any zoom options". Percentage label
 * doubles as a reset-to-100% button (click it to snap back), matching the
 * common convention in PDF viewers this workspace is otherwise styled
 * after (see the Chrome-PDF-viewer reference that shaped this redesign).
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
 *   onFitWidth?: () => void,
 *   onFitHeight?: () => void,
 * }} props
 */
export default function ZoomControl({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  onFitWidth,
  onFitHeight,
}) {
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
      <button
        type="button"
        className={styles.level}
        onClick={onReset}
        title="১০০%-এ ফিরুন"
      >
        {toBanglaDigits(Math.round(zoom * 100))}%
      </button>
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
