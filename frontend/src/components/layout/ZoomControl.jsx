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
 * @param {{ zoom: number, onZoomIn: () => void, onZoomOut: () => void, onReset: () => void }} props
 */
export default function ZoomControl({ zoom, onZoomIn, onZoomOut, onReset }) {
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
    </div>
  );
}
